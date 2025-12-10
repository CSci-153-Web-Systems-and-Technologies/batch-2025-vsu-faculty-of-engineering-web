// composables/useUiTiptapEditor.ts
import { ref, watch } from 'vue'
import { useEditor } from '@tiptap/vue-3'
import type { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import TextAlign from '@tiptap/extension-text-align'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableHeader from '@tiptap/extension-table-header'
import TableCell from '@tiptap/extension-table-cell'
import ResizeImage from 'tiptap-extension-resize-image'
import { getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage'
import { useFirebaseStorage } from 'vuefire'

import FontFamily from '@/extensions/FontFamily'
import FontSize, {
  FONT_SIZE_VALUES,
  isFontSizeValue,
  type FontSizeValue,
} from '@/extensions/FontSize'
import { CustomBold } from '@/extensions/CustomBold'

export interface UseUiTiptapEditorProps {
  modelValue: string
  editing: boolean
}

export type UseUiTiptapEditorEmit = (e: 'update:modelValue', value: string) => void

// Convert old inline font-size styles to fs-* classes (so our FontSize mark can use them)
function convertInlineFontSizesToClasses(html: string): string {
  if (typeof window === 'undefined' || !html) return html
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')

    doc.body.querySelectorAll<HTMLElement>('[style*="font-size"]').forEach((el) => {
      const styleAttr = el.getAttribute('style') || ''
      const match = styleAttr.match(/font-size:\s*(\d+)px/i)
      if (!match) return
      const px = match[1]
      const size = `${px}px`
      if (!isFontSizeValue(size)) return

      const newStyle = styleAttr.replace(/font-size:\s*\d+px;?\s*/i, '').trim()
      if (newStyle) el.setAttribute('style', newStyle)
      else el.removeAttribute('style')

      el.classList.add(`fs-${px}`)
      el.setAttribute('data-fs', size)
    })

    return doc.body.innerHTML
  } catch {
    return html
  }
}

/**
 * Read fontSize from the current selection.
 * - If caret only → value at caret.
 * - If range and all text nodes share same size → that size.
 * - If mixed or no explicit size mark → ''.
 */
function computeSelectionFontSize(editor: Editor | null | undefined): FontSizeValue | '' {
  if (!editor) return ''

  const { state } = editor
  const { from, to, empty } = state.selection

  // Caret only → read current mark
  if (empty) {
    const attrs = editor.getAttributes('fontSize')
    const raw = (attrs?.size ?? attrs?.fontSize) as string | undefined
    return raw && isFontSizeValue(raw) ? raw : ''
  }

  let found: string | null = null
  let mixed = false

  state.doc.nodesBetween(from, to, (node) => {
    if (!node.isText) return
    const mark = node.marks.find((m) => m.type.name === 'fontSize')
    const size = (mark?.attrs?.size ?? mark?.attrs?.fontSize) as string | null

    if (size == null) {
      if (found !== null) {
        mixed = true
        return false
      }
      return
    }

    if (found === null) {
      found = size
    } else if (found !== size) {
      mixed = true
      return false
    }
  })

  if (mixed || !found || !isFontSizeValue(found)) return ''
  return found as FontSizeValue
}

/**
 * Same idea for fontFamily.
 */
function computeSelectionFontFamily(editor: Editor | null | undefined): string {
  if (!editor) return ''

  const { state } = editor
  const { from, to, empty } = state.selection

  // Caret only
  if (empty) {
    const attrs = editor.getAttributes('fontFamily')
    return (attrs?.fontFamily ?? attrs?.family ?? '') as string
  }

  let found: string | null = null
  let mixed = false

  state.doc.nodesBetween(from, to, (node) => {
    if (!node.isText) return
    const mark = node.marks.find((m) => m.type.name === 'fontFamily')
    const fam = (mark?.attrs?.fontFamily ?? mark?.attrs?.family) as string | null

    if (!fam) {
      if (found !== null) {
        mixed = true
        return false
      }
      return
    }

    if (found === null) {
      found = fam
    } else if (found !== fam) {
      mixed = true
      return false
    }
  })

  if (mixed || !found) return ''
  return found
}

export function useUiTiptapEditor(
  props: UseUiTiptapEditorProps,
  emit: UseUiTiptapEditorEmit,
) {
  const storage = useFirebaseStorage()
  const imageInput = ref<HTMLInputElement | null>(null)

  const fontSizes: FontSizeValue[] = [...FONT_SIZE_VALUES]

  // What the dropdowns should currently display
  const currentFontSize = ref<FontSizeValue | ''>('') // '' = mixed / none
  const currentFontFamily = ref<string>('')            // '' = mixed / none

  const editor = useEditor({
    editable: props.editing,
    content: convertInlineFontSizesToClasses(props.modelValue || '<p></p>'),
    extensions: [
      StarterKit.configure({ bold: false }), // use CustomBold instead
      FontSize,
      FontFamily,
      CustomBold,
      Underline,
      Link,
      Image,
      ResizeImage.configure({ allowBase64: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),

      // Tables
      Table.configure({ resizable: true, lastColumnResizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    onUpdate: ({ editor }) => emit('update:modelValue', editor.getHTML()),
    onSelectionUpdate: ({ editor }) => {
      currentFontSize.value = computeSelectionFontSize(editor)
      currentFontFamily.value = computeSelectionFontFamily(editor)
    },
    editorProps: {
      transformPastedHTML: (html) => convertInlineFontSizesToClasses(html),
    },
  })

  // React to `editing` prop
  watch(
    () => props.editing,
    (val) => editor.value?.setEditable(val),
  )

  // Keep external v-model in sync
  watch(
    () => props.modelValue,
    (val) => {
      const normalized = convertInlineFontSizesToClasses(val || '<p></p>')
      const current = editor.value?.getHTML()
      if (editor.value && normalized !== current) {
        editor.value.commands.setContent(normalized, false)
      }
    },
  )

  // Font size dropdown
  function onFontSizeChange(event: Event) {
    const raw = (event.target as HTMLSelectElement).value as FontSizeValue | ''
    currentFontSize.value = raw

    // Blank option → clear size mark
    if (!raw || !isFontSizeValue(raw)) {
      editor.value
        ?.chain()
        .focus()
        .extendMarkRange('fontSize')
        .unsetFontSize()
        .run()
      return
    }

    editor.value
      ?.chain()
      .focus()
      .extendMarkRange('fontSize')
      .unsetFontSize()
      .setFontSize(raw)
      .run()
  }

  // Font family dropdown
  function onFontFamilyChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value
    currentFontFamily.value = value

    const chain = editor.value?.chain().focus()
    if (!chain) return
    if (!value) chain.unsetFontFamily().run()
    else chain.setFontFamily(value).run()
  }

  // Headings (clear fontSize mark first, like Word)
  function setHeading(level: 2 | 3) {
    const chain = editor.value?.chain().focus()
    if (!chain) return

    chain
      .extendMarkRange('fontSize')
      .unsetFontSize()
      .toggleHeading({ level })
      .run()

    // Heading size controlled by CSS; dropdown becomes blank
    currentFontSize.value = ''
  }

  // Links
  function addLink() {
    const url = window.prompt('Enter URL:')
    if (!url) return
    editor.value?.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  // Images
  function triggerImageUpload() {
    imageInput.value?.click()
  }

  async function insertImages(e: Event) {
    const files = (e.target as HTMLInputElement)?.files
    if (!files || files.length === 0) return
    const ed = editor.value
    if (!ed) return

    for (const file of Array.from(files)) {
      const uniqueId =
        crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`
      const path = `editor_images/${uniqueId}-${file.name}`
      const refObj = storageRef(storage, path)
      await uploadBytes(refObj, file)
      const url = await getDownloadURL(refObj)

      ed.commands.focus('end')
      ed.commands.insertContent([
        { type: 'paragraph' },
        { type: 'image', attrs: { src: url } },
        { type: 'paragraph' },
      ])
    }

    if (imageInput.value) imageInput.value.value = ''
  }

  return {
    editor,
    imageInput,
    fontSizes,
    currentFontSize,
    currentFontFamily,
    onFontSizeChange,
    onFontFamilyChange,
    setHeading,
    addLink,
    triggerImageUpload,
    insertImages,
  }
}
