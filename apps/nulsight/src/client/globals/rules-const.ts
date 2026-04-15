import { RULES_CONST } from '../../shared/rules-const'

declare global {
  interface Window {
    BP_RULES_CONST?: typeof RULES_CONST
  }
}

globalThis.BP_RULES_CONST = RULES_CONST
