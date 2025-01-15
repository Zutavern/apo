import { render, screen } from '@testing-library/react'
import { Label } from '@/components/ui/label'

describe('Label', () => {
  it('rendert mit korrektem Text', () => {
    render(<Label>Test Label</Label>)
    expect(screen.getByText('Test Label')).toBeInTheDocument()
  })

  it('übergibt HTML-Attribute korrekt', () => {
    render(<Label htmlFor="test-input">Label Text</Label>)
    expect(screen.getByText('Label Text')).toHaveAttribute('for', 'test-input')
  })

  it('wendet benutzerdefinierte Klassen an', () => {
    render(<Label className="custom-class">Label Text</Label>)
    expect(screen.getByText('Label Text')).toHaveClass('custom-class')
  })
}) 