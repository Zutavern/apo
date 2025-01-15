import { render, screen } from '@testing-library/react'
import Layout from '@/components/layout/Layout'

describe('Layout', () => {
  it('rendert das Layout mit Children', () => {
    render(
      <Layout>
        <div data-testid="test-content">Test Content</div>
      </Layout>
    )
    
    expect(screen.getByTestId('test-content')).toBeInTheDocument()
  })

  it('enthält Header und Footer', () => {
    render(
      <Layout>
        <div>Content</div>
      </Layout>
    )
    
    expect(screen.getByRole('banner')).toBeInTheDocument() // Header
    expect(screen.getByRole('contentinfo')).toBeInTheDocument() // Footer
  })
}) 