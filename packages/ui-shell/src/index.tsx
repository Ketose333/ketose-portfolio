import type {
  CSSProperties,
  ComponentPropsWithoutRef,
  ElementType,
  PropsWithChildren,
  ReactNode,
} from 'react'

type TitleTag = 'h1' | 'h2' | 'h3' | 'div'

type AppFrameProps<T extends ElementType = 'div'> = PropsWithChildren<{
  as?: T
  className?: string
  innerClassName?: string
  maxWidth?: string
  gutter?: string
  centered?: boolean
}>

type SectionIntroProps = {
  className?: string
  eyebrow?: ReactNode
  title?: ReactNode
  description?: ReactNode
  eyebrowClassName?: string
  titleClassName?: string
  descriptionClassName?: string
  titleAs?: TitleTag
}

type ShellChromeProps = PropsWithChildren<{
  shellClassName?: string
  headerClassName?: string
  headerInnerClassName?: string
  contentClassName?: string
  footerClassName?: string
  footerInnerClassName?: string
  brand?: ReactNode
  context?: ReactNode
  nav?: ReactNode
  actions?: ReactNode
  footer?: ReactNode
  sticky?: boolean
  maxWidth?: string
  gutter?: string
}>

type NoticeSurfaceProps = {
  className?: string
  introClassName?: string
  bodyClassName?: string
  actionsClassName?: string
  eyebrow?: ReactNode
  title?: ReactNode
  description?: ReactNode
  body?: ReactNode
  titleAs?: TitleTag
  actions?: ReactNode
}

type OverlaySurfaceProps = {
  className?: string
  headerClassName?: string
  bodyClassName?: string
  footerClassName?: string
  eyebrow?: ReactNode
  title?: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
  body?: ReactNode
  footer?: ReactNode
  titleAs?: TitleTag
}

type ChoiceGridProps = {
  className?: string
  columnsClassName?: string
  items: Array<{
    key: string
    label: ReactNode
    active?: boolean
    disabled?: boolean
    onClick?: () => void
  }>
}

type ButtonSurfaceOwnProps = {
  className?: string
  variant?: 'neutral' | 'solid' | 'ghost'
  size?: 'md' | 'sm'
}

type PanelSurfaceOwnProps = PropsWithChildren<{
  className?: string
  tone?: 'default' | 'strong'
  padding?: 'md' | 'lg'
}>

type FieldGroupProps = PropsWithChildren<{
  className?: string
  label: ReactNode
  hint?: ReactNode
  labelClassName?: string
  hintClassName?: string
  asLabel?: boolean
}>

type PolymorphicProps<T extends ElementType, OwnProps> = OwnProps &
  Omit<ComponentPropsWithoutRef<T>, keyof OwnProps | 'as'> & {
    as?: T
  }

function joinClasses(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ')
}

export function ButtonSurface<T extends ElementType = 'button'>({
  as,
  className,
  variant = 'neutral',
  size = 'md',
  children,
  ...props
}: PolymorphicProps<T, PropsWithChildren<ButtonSurfaceOwnProps>>) {
  const Component = (as || 'button') as ElementType
  const elementProps =
    Component === 'button' && !('type' in props)
      ? { type: 'button' as const, ...(props as ComponentPropsWithoutRef<T>) }
      : (props as ComponentPropsWithoutRef<T>)

  return (
    <Component
      className={joinClasses(
        'ui-shell-button',
        variant === 'solid' && 'ui-shell-button--solid',
        variant === 'ghost' && 'ui-shell-button--ghost',
        size === 'sm' && 'ui-shell-button--sm',
        className,
      )}
      {...elementProps}
    >
      {children}
    </Component>
  )
}

export function PanelSurface<T extends ElementType = 'section'>({
  as,
  className,
  tone = 'default',
  padding = 'md',
  children,
  ...props
}: PolymorphicProps<T, PanelSurfaceOwnProps>) {
  const Component = (as || 'section') as ElementType

  return (
    <Component
      className={joinClasses(
        'ui-shell-panel',
        tone === 'strong' && 'ui-shell-panel--strong',
        padding === 'lg' && 'ui-shell-panel--lg',
        className,
      )}
      {...(props as ComponentPropsWithoutRef<T>)}
    >
      {children}
    </Component>
  )
}

export function FieldGroup({
  className,
  label,
  hint,
  labelClassName,
  hintClassName,
  asLabel = true,
  children,
}: FieldGroupProps) {
  const Component = asLabel ? 'label' : 'div'

  return (
    <Component className={joinClasses('ui-shell-field', className)}>
      <span className={joinClasses('ui-shell-field__label', labelClassName)}>{label}</span>
      {children}
      {hint ? <span className={joinClasses('ui-shell-field__hint', hintClassName)}>{hint}</span> : null}
    </Component>
  )
}

export function AppFrame<T extends ElementType = 'div'>({
  as,
  className,
  innerClassName,
  maxWidth = '1180px',
  gutter = '48px',
  centered = false,
  children,
}: AppFrameProps<T>) {
  const Component = (as || 'div') as ElementType
  const style = {
    '--ui-shell-max-width': maxWidth,
    '--ui-shell-gutter': gutter,
  } as CSSProperties

  return (
    <Component
      className={joinClasses('ui-shell-frame', centered && 'ui-shell-frame--centered', className)}
      style={style}
    >
      <div className={joinClasses('ui-shell-frame__inner', innerClassName)}>{children}</div>
    </Component>
  )
}

export function SectionIntro({
  className,
  eyebrow,
  title,
  description,
  eyebrowClassName,
  titleClassName,
  descriptionClassName,
  titleAs = 'h2',
}: SectionIntroProps) {
  const Title = titleAs

  return (
    <div className={joinClasses('ui-shell-intro', className)}>
      {eyebrow ? (
        <p className={joinClasses('ui-shell-intro__eyebrow', eyebrowClassName)}>
          {eyebrow}
        </p>
      ) : null}
      {title ? <Title className={joinClasses('ui-shell-intro__title', titleClassName)}>{title}</Title> : null}
      {description ? (
        <div className={joinClasses('ui-shell-intro__description', descriptionClassName)}>
          {description}
        </div>
      ) : null}
    </div>
  )
}

export function ShellChrome({
  shellClassName,
  headerClassName,
  headerInnerClassName,
  contentClassName,
  footerClassName,
  footerInnerClassName,
  brand,
  context,
  nav,
  actions,
  footer,
  sticky = true,
  maxWidth = '1180px',
  gutter = '48px',
  children,
}: ShellChromeProps) {
  return (
    <div className={joinClasses('ui-shell-chrome', shellClassName)}>
      {(brand || context || nav || actions) ? (
        <header
          className={joinClasses(
            'ui-shell-chrome__header',
            sticky && 'ui-shell-chrome__header--sticky',
            headerClassName,
          )}
          role="banner"
        >
          <AppFrame
            as="div"
            innerClassName={joinClasses('ui-shell-chrome__header-grid', headerInnerClassName)}
            maxWidth={maxWidth}
            gutter={gutter}
          >
            <div className="ui-shell-chrome__brand-block">
              {brand ? <div className="ui-shell-chrome__brand-slot">{brand}</div> : null}
              {context ? <div className="ui-shell-chrome__context">{context}</div> : null}
            </div>
            {nav ? <div className="ui-shell-chrome__nav">{nav}</div> : null}
            {actions ? <div className="ui-shell-chrome__actions">{actions}</div> : null}
          </AppFrame>
        </header>
      ) : null}

      <div className={joinClasses('ui-shell-chrome__content', contentClassName)}>{children}</div>

      {footer ? (
        <footer className={joinClasses('ui-shell-chrome__footer', footerClassName)} role="contentinfo">
          <AppFrame
            as="div"
            innerClassName={joinClasses('ui-shell-chrome__footer-grid', footerInnerClassName)}
            maxWidth={maxWidth}
            gutter={gutter}
          >
            {footer}
          </AppFrame>
        </footer>
      ) : null}
    </div>
  )
}

export function NoticeSurface({
  className,
  introClassName,
  bodyClassName,
  actionsClassName,
  eyebrow,
  title,
  description,
  body,
  titleAs = 'h1',
  actions,
}: NoticeSurfaceProps) {
  return (
    <section className={joinClasses('ui-shell-notice', className)}>
      <SectionIntro
        className={joinClasses('ui-shell-notice__intro', introClassName)}
        eyebrow={eyebrow}
        title={title}
        description={description}
        titleAs={titleAs}
      />
      {body ? (
        <div className={joinClasses('ui-shell-notice__body', bodyClassName)}>{body}</div>
      ) : null}
      {actions ? (
        <div className={joinClasses('ui-shell-notice__actions', actionsClassName)}>{actions}</div>
      ) : null}
    </section>
  )
}

export function OverlaySurface({
  className,
  headerClassName,
  bodyClassName,
  footerClassName,
  eyebrow,
  title,
  subtitle,
  actions,
  body,
  footer,
  titleAs = 'h2',
}: OverlaySurfaceProps) {
  return (
    <section className={joinClasses('ui-shell-overlay', className)}>
      {(eyebrow || title || subtitle || actions) ? (
        <header className={joinClasses('ui-shell-overlay__header', headerClassName)}>
          <SectionIntro
            className="ui-shell-overlay__intro"
            eyebrow={eyebrow}
            title={title}
            description={subtitle}
            titleAs={titleAs}
          />
          {actions ? <div className="ui-shell-overlay__header-actions">{actions}</div> : null}
        </header>
      ) : null}
      {body ? <div className={joinClasses('ui-shell-overlay__body', bodyClassName)}>{body}</div> : null}
      {footer ? <footer className={joinClasses('ui-shell-overlay__footer', footerClassName)}>{footer}</footer> : null}
    </section>
  )
}

export function ChoiceGrid({ className, columnsClassName, items }: ChoiceGridProps) {
  return (
    <div className={joinClasses('ui-shell-choice-grid', columnsClassName, className)}>
      {items.map((item) => {
        const Element = item.onClick ? 'button' : 'div'
        return (
          <Element
            key={item.key}
            {...(item.onClick
              ? { type: 'button' as const, onClick: item.onClick, disabled: item.disabled }
              : {})}
            className={joinClasses(
              'ui-shell-choice-grid__item',
              item.active && 'ui-shell-choice-grid__item--active',
              item.disabled && 'ui-shell-choice-grid__item--disabled',
            )}
          >
            {item.label}
          </Element>
        )
      })}
    </div>
  )
}
