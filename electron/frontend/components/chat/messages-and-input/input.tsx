import { useState, useRef, useEffect } from 'react'
import { Paperclip, ArrowRight } from 'lucide-react'
import { useActions, useUIState } from 'ai/rsc'
import { type AI } from '@/lib/chat/chat.actions'
import { AutoresizeTextarea } from '@/components/ui/textarea'
import { useComingSoonToast } from '@/components/ui/use-toast'
import { useEnterSubmit } from '@/lib/hooks/chat.use-enter-submit'
import { nanoid } from 'nanoid'
import { UserMessage } from '@/components/vercel-chat/message'
import useCreateResponse from '@/lib/services/sessionService/use-create-response'
import { useSearchParams } from 'next/navigation'
import SelectProjectDirectoryModal from '@/components/modals/select-project-directory-modal'

export function VercelInput({
    isAtBottom,
    scrollToBottom,
}: {
    isAtBottom: boolean
    scrollToBottom: () => void
}) {
    const [focused, setFocused] = useState(false)
    const toast = useComingSoonToast()
    const { formRef, onKeyDown } = useEnterSubmit()
    const inputRef = useRef<HTMLTextAreaElement>(null)
    const [input, setInput] = useState('')
    const [_, setMessages] = useUIState<typeof AI>()
    const { submitUserMessage } = useActions()

    function handleFocus() {
        setFocused(true)
    }

    return (
        <div className="relative grid align-middle px-5 pb-7 mt-8">
            <form
                ref={formRef}
                onSubmit={async (e: any) => {
                    e.preventDefault()

                    // Blur focus on mobile
                    if (window.innerWidth < 600) {
                        e.target['message']?.blur()
                    }

                    const value = input.trim()
                    setInput('')
                    if (!value) return

                    // Optimistically add user message UI
                    setMessages(currentMessages => [
                        ...currentMessages,
                        {
                            id: nanoid(),
                            display: <UserMessage>{value}</UserMessage>,
                        },
                    ])

                    // Submit and get response message
                    const responseMessage = await submitUserMessage(value)
                    setMessages(currentMessages => [
                        ...currentMessages,
                        responseMessage,
                    ])

                    scrollToBottom()
                }}
            >
                <div className="relative">
                    <AutoresizeTextarea
                        ref={inputRef}
                        placeholder="Give Devon a task to work on ..."
                        onFocus={handleFocus}
                        onBlur={() => setFocused(false)}
                        rows={1}
                        onKeyDown={onKeyDown}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                    />
                    <button
                        onClick={toast}
                        className="absolute left-[0.5rem] top-1/2 -translate-y-1/2 xl:left-[0.75rem] flex h-8 w-8 items-center justify-center rounded-md smooth-hover"
                    >
                        <Paperclip
                            className={`h-4 w-4 ${focused ? 'text-primary' : ''}`}
                        />
                    </button>
                    <button
                        className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 xl:right-4"
                        type="submit"
                    >
                        <ArrowRight
                            className={`h-4 w-4 ${focused ? 'text-primary' : ''}`}
                        />
                    </button>
                </div>
            </form>
        </div>
    )
}

export function RegularInput({
    isAtBottom,
    scrollToBottom,
    sessionId,
    setUserRequested,
    userRequested,
}: {
    isAtBottom: boolean
    scrollToBottom: () => void
    sessionId: string
    setUserRequested: (value: boolean) => void
    userRequested: boolean
}) {
    const [focused, setFocused] = useState(false)
    const toast = useComingSoonToast()
    const { formRef, onKeyDown } = useEnterSubmit()
    const inputRef = useRef<HTMLTextAreaElement>(null)
    const [input, setInput] = useState('')
    // const [_, setMessages] = useUIState<typeof AI>()
    const [messages, setMessages] = useState<any[]>([])
    // const { submitUserMessage } = useActions()
    const { createResponse, responseData, loading, error } = useCreateResponse()

    // For blocking user with modal
    const searchParams = useSearchParams()
    const [openProjectModal, setOpenProjectModal] = useState(false)

    async function submitUserMessage(value: string) {
        setUserRequested(false)
        return createResponse(sessionId, value)
    }

    function checkShouldOpenModal() {
        const chatId = searchParams.get('chat')
        // If it's a new chat, open the project modal
        if (chatId && chatId === 'New') {
            setOpenProjectModal(true)
        }
    }

    function handleFocus() {
        setFocused(true)
        checkShouldOpenModal()
    }

    return (
        <div className="relative grid align-middle px-5 pb-7 mt-8">
            {userRequested && <InformationBox />}
            <form
                ref={formRef}
                onSubmit={async (e: any) => {
                    e.preventDefault()

                    checkShouldOpenModal()

                    // Blur focus on mobile
                    if (window.innerWidth < 600) {
                        e.target['message']?.blur()
                    }

                    const value = input.trim()
                    setInput('')
                    if (!value) return

                    // Optimistically add user message UI
                    setMessages(currentMessages => [
                        ...currentMessages,
                        {
                            id: nanoid(),
                            display: <UserMessage>{value}</UserMessage>,
                        },
                    ])

                    // Submit and get response message
                    const responseMessage = await submitUserMessage(value)
                    setMessages(currentMessages => [
                        ...currentMessages,
                        responseMessage,
                    ])

                    scrollToBottom()
                }}
            >
                <div className="relative">
                    <AutoresizeTextarea
                        ref={inputRef}
                        placeholder="Give Devon a task to work on ..."
                        onFocus={handleFocus}
                        onBlur={() => setFocused(false)}
                        rows={1}
                        onKeyDown={onKeyDown}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                    />
                    <button
                        onClick={toast}
                        className="absolute left-[0.5rem] top-1/2 -translate-y-1/2 xl:left-[0.75rem] flex h-8 w-8 items-center justify-center rounded-md smooth-hover"
                    >
                        <Paperclip
                            className={`h-4 w-4 ${focused ? 'text-primary' : ''}`}
                        />
                    </button>
                    <button
                        className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 xl:right-4"
                        type="submit"
                    >
                        <ArrowRight
                            className={`h-4 w-4 ${focused ? 'text-primary' : ''}`}
                        />
                    </button>
                </div>
            </form>
            <SelectProjectDirectoryModal
                openProjectModal={openProjectModal}
                setOpenProjectModal={setOpenProjectModal}
            />
        </div>
    )
}

const InformationBox = () => {
    return (
        <div className="bg-fade-bottom-to-top2 py-5 px-3">
            <div className="flex items-center gap-4">
                <div className="relative flex justify-center items-center">
                    <div className="w-7 h-7 rounded-full bg-orange animate-pulse"></div>
                    <div className="absolute w-4 h-4 rounded-full bg-orange opacity-50"></div>
                </div>
                <p className="italic text-gray-400">
                    Devon is awaiting your response.
                </p>
            </div>
        </div>
    )
}
