/**
 * Chat V2 Components - Theater Soul Experience v4.0
 *
 * New generation of immersive chat UI components with:
 * - Persona 5 inspired radial menus
 * - Typewriter text effects
 * - Emotion transition animations
 * - Mobile gesture support
 * - Context-aware quick actions
 * - Dynamic backgrounds with scene switching
 * - Enhanced input with inline pills
 * - CG reveal system
 * - Asset gallery integration
 */

// ============= Core Message Components =============
export { default as ImmersiveMessageBubbleV2 } from './ImmersiveMessageBubble.v2'
export { default as TypewriterText } from './TypewriterText'
export { default as EmotionTransitionBadge, EMOTION_COLORS, EMOTION_EMOJI, EMOTION_LABEL } from './EmotionTransitionBadge'
export type { EmotionType } from './EmotionTransitionBadge'

// ============= Message Actions =============
export { default as MessageContextMenu } from './MessageContextMenu'
export type { MessageContextMenuProps } from './MessageContextMenu'
export { default as RadialMenu } from './RadialMenu'
export { default as ContextAwareQuickActions } from './ContextAwareQuickActions'
export { default as CreativeDirectivePills } from './CreativeDirectivePills'

// ============= Input Components =============
export { default as MessageInputV2, MessageInputV2 as EnhancedMessageInput } from './MessageInput.v2'
export { SendButtonWithGlow } from './SendButtonWithGlow'
export { default as MiniInputBar } from './MiniInputBar'

// ============= Status Components =============
export { default as ImmersiveStatusBar, StatusBadge } from './ImmersiveStatusBar'
export type { StatusType } from './ImmersiveStatusBar'

// ============= Visual Components =============
export { CharacterPortraitPanel } from './CharacterPortraitPanel.v2'
export { default as CharacterPortraitPanelV3 } from './CharacterPortraitPanel.v3'
export { default as CharacterPortraitPanelV4 } from './CharacterPortraitPanel.v4'
export { DynamicBackground } from './DynamicBackground'

// ============= v4.0: Asset Components =============
export { default as SceneSelector } from './SceneSelector'
export { default as CGReveal } from './CGReveal'

// ============= Mobile Gestures =============
export * from './MobileGestures'

// ============= Main Container =============
export { default as ImmersiveChatV2Container } from './ImmersiveChatV2Container'
