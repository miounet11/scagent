/**
 * MessageContextMenu Component Tests
 *
 * Tests for the floating action toolbar component
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MantineProvider } from '@mantine/core'
import MessageContextMenu from '../MessageContextMenu'

// Mock useReducedMotion hook
jest.mock('@mantine/hooks', () => ({
  useReducedMotion: jest.fn(() => false),
}))

// Test wrapper with Mantine provider
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <MantineProvider>{children}</MantineProvider>
)

describe('MessageContextMenu', () => {
  const mockHandlers = {
    onCopy: jest.fn(),
    onEdit: jest.fn(),
    onRegenerate: jest.fn(),
    onDelete: jest.fn(),
    onPlayTTS: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render when visible is true', () => {
      render(
        <TestWrapper>
          <MessageContextMenu {...mockHandlers} visible={true} />
        </TestWrapper>
      )

      expect(screen.getByRole('toolbar', { name: 'Message actions' })).toBeInTheDocument()
    })

    it('should not render when visible is false', () => {
      const { container } = render(
        <TestWrapper>
          <MessageContextMenu {...mockHandlers} visible={false} />
        </TestWrapper>
      )

      expect(container.querySelector('[role="toolbar"]')).not.toBeInTheDocument()
    })

    it('should render all action buttons', () => {
      render(
        <TestWrapper>
          <MessageContextMenu {...mockHandlers} visible={true} />
        </TestWrapper>
      )

      expect(screen.getByLabelText('Copy message to clipboard')).toBeInTheDocument()
      expect(screen.getByLabelText('Edit this message')).toBeInTheDocument()
      expect(screen.getByLabelText('Regenerate this response')).toBeInTheDocument()
      expect(screen.getByLabelText('Delete this message')).toBeInTheDocument()
    })

    it('should render TTS button when onPlayTTS is provided', () => {
      render(
        <TestWrapper>
          <MessageContextMenu {...mockHandlers} visible={true} />
        </TestWrapper>
      )

      expect(screen.getByLabelText('Play text-to-speech')).toBeInTheDocument()
    })

    it('should not render TTS button when onPlayTTS is omitted', () => {
      const { onPlayTTS, ...handlersWithoutTTS } = mockHandlers

      render(
        <TestWrapper>
          <MessageContextMenu {...handlersWithoutTTS} visible={true} />
        </TestWrapper>
      )

      expect(screen.queryByLabelText('Play text-to-speech')).not.toBeInTheDocument()
    })
  })

  describe('User Interactions', () => {
    it('should call onCopy when copy button is clicked', async () => {
      const user = userEvent.setup()

      render(
        <TestWrapper>
          <MessageContextMenu {...mockHandlers} visible={true} />
        </TestWrapper>
      )

      await user.click(screen.getByLabelText('Copy message to clipboard'))

      expect(mockHandlers.onCopy).toHaveBeenCalledTimes(1)
    })

    it('should call onEdit when edit button is clicked', async () => {
      const user = userEvent.setup()

      render(
        <TestWrapper>
          <MessageContextMenu {...mockHandlers} visible={true} />
        </TestWrapper>
      )

      await user.click(screen.getByLabelText('Edit this message'))

      expect(mockHandlers.onEdit).toHaveBeenCalledTimes(1)
    })

    it('should call onRegenerate when regenerate button is clicked', async () => {
      const user = userEvent.setup()

      render(
        <TestWrapper>
          <MessageContextMenu {...mockHandlers} visible={true} />
        </TestWrapper>
      )

      await user.click(screen.getByLabelText('Regenerate this response'))

      expect(mockHandlers.onRegenerate).toHaveBeenCalledTimes(1)
    })

    it('should call onDelete when delete button is clicked', async () => {
      const user = userEvent.setup()

      render(
        <TestWrapper>
          <MessageContextMenu {...mockHandlers} visible={true} />
        </TestWrapper>
      )

      await user.click(screen.getByLabelText('Delete this message'))

      expect(mockHandlers.onDelete).toHaveBeenCalledTimes(1)
    })

    it('should call onPlayTTS when TTS button is clicked', async () => {
      const user = userEvent.setup()

      render(
        <TestWrapper>
          <MessageContextMenu {...mockHandlers} visible={true} />
        </TestWrapper>
      )

      await user.click(screen.getByLabelText('Play text-to-speech'))

      expect(mockHandlers.onPlayTTS).toHaveBeenCalledTimes(1)
    })
  })

  describe('TTS State', () => {
    it('should show play icon when TTS is not playing', () => {
      render(
        <TestWrapper>
          <MessageContextMenu {...mockHandlers} visible={true} isPlaying={false} />
        </TestWrapper>
      )

      expect(screen.getByLabelText('Play text-to-speech')).toBeInTheDocument()
    })

    it('should show stop icon when TTS is playing', () => {
      render(
        <TestWrapper>
          <MessageContextMenu {...mockHandlers} visible={true} isPlaying={true} />
        </TestWrapper>
      )

      expect(screen.getByLabelText('Stop text-to-speech playback')).toBeInTheDocument()
    })

    it('should have aria-pressed attribute matching isPlaying state', () => {
      const { rerender } = render(
        <TestWrapper>
          <MessageContextMenu {...mockHandlers} visible={true} isPlaying={false} />
        </TestWrapper>
      )

      let ttsButton = screen.getByLabelText('Play text-to-speech')
      expect(ttsButton).toHaveAttribute('aria-pressed', 'false')

      rerender(
        <TestWrapper>
          <MessageContextMenu {...mockHandlers} visible={true} isPlaying={true} />
        </TestWrapper>
      )

      ttsButton = screen.getByLabelText('Stop text-to-speech playback')
      expect(ttsButton).toHaveAttribute('aria-pressed', 'true')
    })
  })

  describe('Keyboard Navigation', () => {
    it('should support tab navigation through buttons', async () => {
      const user = userEvent.setup()

      render(
        <TestWrapper>
          <MessageContextMenu {...mockHandlers} visible={true} />
        </TestWrapper>
      )

      // Tab through buttons
      await user.tab()
      expect(screen.getByLabelText('Copy message to clipboard')).toHaveFocus()

      await user.tab()
      expect(screen.getByLabelText('Edit this message')).toHaveFocus()

      await user.tab()
      expect(screen.getByLabelText('Regenerate this response')).toHaveFocus()

      await user.tab()
      expect(screen.getByLabelText('Play text-to-speech')).toHaveFocus()

      await user.tab()
      expect(screen.getByLabelText('Delete this message')).toHaveFocus()
    })

    it('should activate buttons with Enter key', async () => {
      const user = userEvent.setup()

      render(
        <TestWrapper>
          <MessageContextMenu {...mockHandlers} visible={true} />
        </TestWrapper>
      )

      // Focus and activate copy button
      const copyButton = screen.getByLabelText('Copy message to clipboard')
      copyButton.focus()
      await user.keyboard('{Enter}')

      expect(mockHandlers.onCopy).toHaveBeenCalledTimes(1)
    })

    it('should activate buttons with Space key', async () => {
      const user = userEvent.setup()

      render(
        <TestWrapper>
          <MessageContextMenu {...mockHandlers} visible={true} />
        </TestWrapper>
      )

      // Focus and activate edit button
      const editButton = screen.getByLabelText('Edit this message')
      editButton.focus()
      await user.keyboard(' ')

      expect(mockHandlers.onEdit).toHaveBeenCalledTimes(1)
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA role', () => {
      render(
        <TestWrapper>
          <MessageContextMenu {...mockHandlers} visible={true} />
        </TestWrapper>
      )

      expect(screen.getByRole('toolbar', { name: 'Message actions' })).toBeInTheDocument()
    })

    it('should have descriptive aria-labels for all buttons', () => {
      render(
        <TestWrapper>
          <MessageContextMenu {...mockHandlers} visible={true} />
        </TestWrapper>
      )

      expect(screen.getByLabelText('Copy message to clipboard')).toBeInTheDocument()
      expect(screen.getByLabelText('Edit this message')).toBeInTheDocument()
      expect(screen.getByLabelText('Regenerate this response')).toBeInTheDocument()
      expect(screen.getByLabelText('Delete this message')).toBeInTheDocument()
      expect(screen.getByLabelText('Play text-to-speech')).toBeInTheDocument()
    })

    it('should apply custom className', () => {
      const { container } = render(
        <TestWrapper>
          <MessageContextMenu {...mockHandlers} visible={true} className="custom-class" />
        </TestWrapper>
      )

      expect(container.querySelector('.custom-class')).toBeInTheDocument()
    })
  })

  describe('Reduced Motion', () => {
    it('should respect prefers-reduced-motion setting', () => {
      const { useReducedMotion } = require('@mantine/hooks')
      useReducedMotion.mockReturnValue(true)

      render(
        <TestWrapper>
          <MessageContextMenu {...mockHandlers} visible={true} />
        </TestWrapper>
      )

      // Component should still render but with reduced animations
      expect(screen.getByRole('toolbar')).toBeInTheDocument()
    })
  })

  describe('Tooltips', () => {
    it('should show tooltip on button hover', async () => {
      const user = userEvent.setup()

      render(
        <TestWrapper>
          <MessageContextMenu {...mockHandlers} visible={true} />
        </TestWrapper>
      )

      const copyButton = screen.getByLabelText('Copy message to clipboard')
      await user.hover(copyButton)

      await waitFor(() => {
        expect(screen.getByText('Copy message')).toBeInTheDocument()
      })
    })

    it('should show correct tooltip for TTS playing state', async () => {
      const user = userEvent.setup()

      const { rerender } = render(
        <TestWrapper>
          <MessageContextMenu {...mockHandlers} visible={true} isPlaying={false} />
        </TestWrapper>
      )

      const ttsButton = screen.getByLabelText('Play text-to-speech')
      await user.hover(ttsButton)

      await waitFor(() => {
        expect(screen.getByText('Play audio')).toBeInTheDocument()
      })

      rerender(
        <TestWrapper>
          <MessageContextMenu {...mockHandlers} visible={true} isPlaying={true} />
        </TestWrapper>
      )

      const stopButton = screen.getByLabelText('Stop text-to-speech playback')
      await user.hover(stopButton)

      await waitFor(() => {
        expect(screen.getByText('Stop audio')).toBeInTheDocument()
      })
    })
  })
})
