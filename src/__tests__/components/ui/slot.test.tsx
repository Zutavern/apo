import { render, screen } from '@testing-library/react'
import { Slot } from '@/components/ui/slot'

describe('Slot', () => {
  it('rendert Children korrekt', () => {
    render(
      <Slot>
        <div data-testid="child">Test Content</div>
      </Slot>
    )
    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  it('übergibt Props an Children', () => {
    const TestComponent = (props: { className?: string }) => (
      <div data-testid="test" className={props.className} />
    )

    render(
      <Slot className="test-class">
        <TestComponent />
      </Slot>
    )
    expect(screen.getByTestId('test')).toHaveClass('test-class')
  })
}) 