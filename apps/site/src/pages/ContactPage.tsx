import { useMemo, useState, type FormEvent } from 'react'
import { portfolioUrls } from '@portfolio/services'
import { AppFrame, ButtonSurface, FieldGroup, SectionPanel } from '@portfolio/ui-shell'

type ContactFormState = {
  name: string
  email: string
  subject: string
  message: string
}

const initialFormState: ContactFormState = {
  name: '',
  email: '',
  subject: '',
  message: '',
}

export function ContactPage() {
  const [formState, setFormState] = useState<ContactFormState>(initialFormState)
  const [isPrepared, setIsPrepared] = useState(false)

  const mailtoUrl = useMemo(() => {
    const subject = formState.subject.trim() || '포트폴리오 연락'
    const body = [
      `성함: ${formState.name.trim() || '-'}`,
      `이메일: ${formState.email.trim() || '-'}`,
      '',
      formState.message.trim() || '문의 내용을 입력해주세요.',
    ].join('\n')

    return `mailto:${portfolioUrls.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }, [formState])

  function updateField(field: keyof ContactFormState, value: string) {
    setFormState((current) => ({ ...current, [field]: value }))
    setIsPrepared(false)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsPrepared(true)
  }

  return (
    <AppFrame as="main" innerClassName="contact-page" maxWidth="1428px" gutter="96px">
      <section className="contact-hero" aria-labelledby="contact-title">
        <div className="contact-hero__copy">
          <h1 id="contact-title">연락하기</h1>
          <p>
            프로젝트 협업이나 채용 관련 문의를 남겨주세요. 입력한 내용은 메일 본문으로 정리됩니다.
          </p>
        </div>

        <div className="contact-layout">
          <SectionPanel as="section" className="contact-form-card" aria-label="문의 양식">
            <form className="contact-form" onSubmit={handleSubmit}>
              <div className="contact-form__grid">
                <FieldGroup label="성함" labelClassName="contact-field__label">
                  <input
                    autoComplete="name"
                    className="contact-input"
                    onChange={(event) => updateField('name', event.target.value)}
                    placeholder="홍길동"
                    required
                    type="text"
                    value={formState.name}
                  />
                </FieldGroup>
                <FieldGroup label="이메일 주소" labelClassName="contact-field__label">
                  <input
                    autoComplete="email"
                    className="contact-input"
                    onChange={(event) => updateField('email', event.target.value)}
                    placeholder="example@email.com"
                    required
                    type="email"
                    value={formState.email}
                  />
                </FieldGroup>
              </div>

              <FieldGroup label="제목" labelClassName="contact-field__label">
                <input
                  className="contact-input"
                  onChange={(event) => updateField('subject', event.target.value)}
                  placeholder="문의 제목을 입력해주세요"
                  required
                  type="text"
                  value={formState.subject}
                />
              </FieldGroup>

              <FieldGroup label="문의 내용" labelClassName="contact-field__label">
                <textarea
                  className="contact-input contact-input--textarea"
                  onChange={(event) => updateField('message', event.target.value)}
                  placeholder="어떤 프로젝트를 계획 중이신가요?"
                  required
                  rows={7}
                  value={formState.message}
                />
              </FieldGroup>

              <div className="contact-form__actions">
                <ButtonSurface className="contact-submit" type="submit" variant="solid">
                  {isPrepared ? '메일 준비 완료' : '메시지 보내기'}
                  <span aria-hidden="true">-&gt;</span>
                </ButtonSurface>
                {isPrepared ? (
                  <ButtonSurface
                    as="a"
                    className="contact-open-link"
                    href={mailtoUrl}
                    variant="ghost"
                  >
                    메일 보내기
                  </ButtonSurface>
                ) : null}
              </div>
            </form>
          </SectionPanel>

          <SectionPanel as="aside" className="contact-direct-card" aria-label="직접 문의">
            <div className="contact-direct">
              <section>
                <h2>직접 문의</h2>
                <a className="contact-direct__link" href={`mailto:${portfolioUrls.email}`}>
                  <span aria-hidden="true">@</span>
                  <strong>{portfolioUrls.email}</strong>
                </a>
              </section>

              <section className="contact-direct__note">
                <h2>응답 기준</h2>
                <p>프로젝트 범위, 역할, 확인할 링크를 함께 남겨주세요.</p>
              </section>
            </div>
          </SectionPanel>
        </div>
      </section>
    </AppFrame>
  )
}
