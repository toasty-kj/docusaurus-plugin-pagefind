import '@docsearch/css'
import type {
	DocSearchModalProps,
	DocSearchTransformClient,
} from '@docsearch/react';
import { DocSearchButton, useDocSearchKeyboardEvents } from '@docsearch/react';
import { useHistory } from '@docusaurus/router';
import { Icon } from '@iconify/react';
import type React from 'react';
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

function HitIcon({ isSection }: { isSection: boolean }): React.JSX.Element {
	return (
		<span className="pagefindHit-icon" aria-hidden="true">
			<Icon
				icon={isSection ? 'mdi:hashtag' : 'mdi:file-document-outline'}
				width={14}
				height={14}
			/>
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
