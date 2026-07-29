import { emailSchema, passwordSchema, credentialsSchema } from '../../utils/auth/authValidation'

describe('emailSchema', () => {
  it('akceptuje poprawny adres e-mail', () => {
    // Arrange
    const email = 'test@example.com'

    // Act
    const result = emailSchema.safeParse(email)

    // Assert
    expect(result.success).toBe(true)
  })

  it('odrzuca pusty adres e-mail', () => {
    // Arrange
    const email = ''

    // Act
    const result = emailSchema.safeParse(email)

    // Assert
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.map(i => i.message)).toContain('Wpisz adres e-mail.')
    }
  })

  it('odrzuca adres e-mail w niepoprawnym formacie', () => {
    // Arrange
    const email = 'nie-jest-emailem'

    // Act
    const result = emailSchema.safeParse(email)

    // Assert
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.map(i => i.message)).toContain('Podaj poprawny adres e-mail.')
    }
  })
})

describe('passwordSchema', () => {
  it('akceptuje hasło mające co najmniej 6 znaków', () => {
    // Arrange
    const password = 'sekret'

    // Act
    const result = passwordSchema.safeParse(password)

    // Assert
    expect(result.success).toBe(true)
  })

  it('odrzuca puste hasło', () => {
    // Arrange
    const password = ''

    // Act
    const result = passwordSchema.safeParse(password)

    // Assert
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.map(i => i.message)).toContain('Wpisz hasło.')
    }
  })

  it('odrzuca hasło krótsze niż 6 znaków', () => {
    // Arrange
    const password = 'abc'

    // Act
    const result = passwordSchema.safeParse(password)

    // Assert
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.map(i => i.message)).toContain('Hasło musi mieć co najmniej 6 znaków.')
    }
  })
})

describe('credentialsSchema', () => {
  it('akceptuje poprawny komplet danych logowania', () => {
    // Arrange
    const credentials = { email: 'test@example.com', password: 'sekret123' }

    // Act
    const result = credentialsSchema.safeParse(credentials)

    // Assert
    expect(result.success).toBe(true)
  })

  it('odrzuca komplet danych z niepoprawnym e-mailem', () => {
    // Arrange
    const credentials = { email: 'zly-email', password: 'sekret123' }

    // Act
    const result = credentialsSchema.safeParse(credentials)

    // Assert
    expect(result.success).toBe(false)
  })

  it('odrzuca komplet danych ze zbyt krótkim hasłem', () => {
    // Arrange
    const credentials = { email: 'test@example.com', password: '123' }

    // Act
    const result = credentialsSchema.safeParse(credentials)

    // Assert
    expect(result.success).toBe(false)
  })
})
