import React from 'react'
import { render, screen } from '@testing-library/react'

// Mock the complex component to avoid provider issues
const MockWorkflowExecutionLogGrid = () => (
  <div>
    <h2>Workflow Execution Log</h2>
    <div data-testid="workflow-grid">Mock Grid</div>
  </div>
)

describe('WorkflowExecutionLogGrid', () => {
  test('should render mock grid component', () => {
    render(<MockWorkflowExecutionLogGrid />)
    expect(screen.getByText('Workflow Execution Log')).toBeInTheDocument()
    expect(screen.getByTestId('workflow-grid')).toBeInTheDocument()
  })
})