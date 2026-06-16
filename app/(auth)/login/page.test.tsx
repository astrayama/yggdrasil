import { render, screen } from '@testing-library/react'
import LoginPage from './page'

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    signInWithGoogle: jest.fn(),
    signInWithEmail: jest.fn(),
    signUpWithEmail: jest.fn(),
    error: null,
  }),
}))

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}))

describe('LoginPage', () => {
  it('renders the Google sign-in action', () => {
    render(<LoginPage />)

    expect(
      screen.getByText(/Welcome.*to Yggdrasil/i),
    ).toBeInTheDocument()

    expect(
      screen.getByRole('button', {
        name: /sign in with google/i,
      }),
    ).toBeInTheDocument()
  })
})