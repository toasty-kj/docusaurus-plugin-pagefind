import '@docsearch/css'
import type {
	DocSearchModalProps,
	DocSearchTransformClient
} from '@docsearch/react'
import { DocSearchButton, useDocSearchKeyboardEvents } from '@docsearch/react'
import { useHistory } from '@docusaurus/router'
import type React from 'react'
import {
	Fragment,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState
} from 'react'
import { createPortal } from 'react-dom'
import { createPagefindSearch } from './PagefindClient'
import type { DocSearchHit, HighlightSegment } from './transformHits'
import './styles.css'

type LazyModalProps = DocSearchModalProps
let DocSearchModalComponent: React.ComponentType<LazyModalProps> | null = null

async function importDocSearchModal() {
	if (DocSearchModalComponent) return DocSearchModalComponent
	const mod = await import('@docsearch/react/modal')
	DocSearchModalComponent = mod.DocSearchModal
	return DocSearchModalComponent
}

// Inline copies of mdi:hashtag and mdi:file-document-outline (24x24 viewBox)
// so the search bar doesn't pull in @iconify/react for two static icons.
const HASHTAG_PATH =
	'm5.41 21l.71-4h-4l.35-2h4l1.06-6h-4l.35-2h4l.71-4h2l-.71 4h6l.71-4h2l-.71 4h4l-.35 2h-4l-1.06 6h4l-.35 2h-4l-.71 4h-2l.71-4h-6l-.71 4z'
const FILE_DOCUMENT_OUTLINE_PATH =
	'M6 2a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm0 2h7v5h5v11H6zm2 8v2h8v-2zm0 4v2h5v-2z'

function HitIcon({ isSection }: { isSection: boolean }): React.JSX.Element {
	return (
		<span className="pagefindHit-icon" aria-hidden="true">
			<svg viewBox="0 0 24 24" aria-hidden="true">
				<path
					fill="currentColor"
					d={isSection ? HASHTAG_PATH : FILE_DOCUMENT_OUTLINE_PATH}
				/>
			</svg>
		</span>
	)
}

// React auto-escapes text — no dangerouslySetInnerHTML needed, XSS-safe
function Highlighted({
	segments
}: {
	segments: HighlightSegment[]
}): React.JSX.Element {
	return (
		<>
			{segments.map((segment, index) =>
				segment.highlight ? (
					// biome-ignore lint/suspicious/noArrayIndexKey: segments are a stable, ordered decomposition of a fixed string; they never reorder and hold no state
					<mark key={index}>{segment.text}</mark>
				) : (
					// biome-ignore lint/suspicious/noArrayIndexKey: segments are a stable, ordered decomposition of a fixed string; they never reorder and hold no state
					<Fragment key={index}>{segment.text}</Fragment>
				)
			)}
		</>
	)
}

function Hit({ hit }: { hit: DocSearchHit }) {
	const isSection = hit.hierarchy.lvl2 !== null
	return (
		<a href={hit.url} className="pagefindHit">
			<HitIcon isSection={isSection} />
			<span className="pagefindHit-body">
				{hit.breadcrumbSegments.length > 0 ? (
					<span className="pagefindHit-breadcrumb">
						<Highlighted segments={hit.breadcrumbSegments} />
					</span>
				) : null}
				<span className="pagefindHit-title">
					<Highlighted segments={hit.titleSegments} />
				</span>
				{hit.contentSegments.length > 0 ? (
					<span className="pagefindHit-excerpt">
						<Highlighted segments={hit.contentSegments} />
					</span>
				) : null}
			</span>
		</a>
	)
}

export default function SearchBar(): React.JSX.Element {
	const history = useHistory()
	const searchButtonRef = useRef<HTMLButtonElement>(null)
	const [isOpen, setIsOpen] = useState(false)
	const [initialQuery, setInitialQuery] = useState<string | undefined>(
		undefined
	)

	const pagefindSearch = useMemo(() => createPagefindSearch(), [])

	const transformSearchClient = useCallback(
		(client: DocSearchTransformClient): DocSearchTransformClient => ({
			...client,
			search: pagefindSearch as DocSearchTransformClient['search']
		}),
		[pagefindSearch]
	)

	const onOpen = useCallback(() => {
		void importDocSearchModal().then(() => setIsOpen(true))
	}, [])

	const onClose = useCallback(() => {
		setIsOpen(false)
	}, [])

	const onInput = useCallback(
		(event: KeyboardEvent) => {
			setInitialQuery(event.key)
			onOpen()
		},
		[onOpen]
	)

	useDocSearchKeyboardEvents({
		isOpen,
		onOpen,
		onClose,
		onInput,
		searchButtonRef
	})

	useEffect(() => {
		if (isOpen) document.body.classList.add('DocSearch--active')
		else document.body.classList.remove('DocSearch--active')
	}, [isOpen])

	const navigator = useRef({
		navigate: ({ itemUrl }: { itemUrl: string }) => {
			history.push(itemUrl)
		}
	}).current

	return (
		<>
			<DocSearchButton
				onTouchStart={importDocSearchModal}
				onFocus={importDocSearchModal}
				onMouseOver={importDocSearchModal}
				onClick={onOpen}
				ref={searchButtonRef}
			/>
			{isOpen && DocSearchModalComponent && typeof document !== 'undefined'
				? createPortal(
						<div className="pagefindModalShell">
							<DocSearchModalComponent
								onClose={onClose}
								initialScrollY={window.scrollY}
								initialQuery={initialQuery}
								navigator={navigator}
								transformSearchClient={transformSearchClient}
								indexName="pagefind"
								appId="pagefind"
								apiKey="pagefind"
								disableUserPersonalization={true}
								hitComponent={
									Hit as unknown as DocSearchModalProps['hitComponent']
								}
							/>
						</div>,
						document.body
					)
				: null}
		</>
	)
}
