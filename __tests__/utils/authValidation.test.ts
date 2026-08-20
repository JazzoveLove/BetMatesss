import { emailSchema, passwordSchema, credentialsSchema } from '@/features/auth/utils/authValidation'

describe('emailSchema', () => {
  it('akceptuje poprawny adres e-mail', () => {
    const email = 'test@example.com'

    const result = emailSchema.safeParse(email)

    expect(result.success).toBe(true)
  })

  it('odrzuca pusty adres e-mail', () => {
    const email = ''

    const result = emailSchema.safeParse(email)

    expect(result.success).toBe(false)
    const messages = !result.success ? result.error.issues.map(i => i.message) : []
    expect(messages).toContain('Wpisz adres e-mail.')
  })

  it('odrzuca adres e-mail w niepoprawnym formacie', () => {
    const email = 'nie-jest-emailem'

    const result = emailSchema.safeParse(email)

    expect(result.success).toBe(false)
    const messages = !result.success ? result.error.issues.map(i => i.message) : []
    expect(messages).toContain('Podaj poprawny adres e-mail.')
  })
})

describe('passwordSchema', () => {
  it('akceptuje hasło mające co najmniej 6 znaków', () => {
    const password = 'sekret'

    const result = passwordSchema.safeParse(password)

    expect(result.success).toBe(true)
  })

  it('odrzuca puste hasło', () => {
    const password = ''

    const result = passwordSchema.safeParse(password)

    expect(result.success).toBe(false)
    const messages = !result.success ? result.error.issues.map(i => i.message) : []
    expect(messages).toContain('Wpisz hasło.')
  })

  it('odrzuca hasło krótsze niż 6 znaków', () => {
    const password = 'abc'

    const result = passwordSchema.safeParse(password)

    expect(result.success).toBe(false)
    const messages = !result.success ? result.error.issues.map(i => i.message) : []
    expect(messages).toContain('Hasło musi mieć co najmniej 6 znaków.')
  })
})

describe('credentialsSchema', () => {
  it('akceptuje poprawny komplet danych logowania', () => {
    const credentials = { email: 'test@example.com', password: 'sekret123' }

    const result = credentialsSchema.safeParse(credentials)

    expect(result.success).toBe(true)
  })

  it('odrzuca komplet danych z niepoprawnym e-mailem', () => {
    const credentials = { email: 'zly-email', password: 'sekret123' }

    const result = credentialsSchema.safeParse(credentials)

    expect(result.success).toBe(false)
  })

  it('odrzuca komplet danych ze zbyt krótkim hasłem', () => {
    const credentials = { email: 'test@example.com', password: '123' }

    const result = credentialsSchema.safeParse(credentials)

    expect(result.success).toBe(false)
  })
})
