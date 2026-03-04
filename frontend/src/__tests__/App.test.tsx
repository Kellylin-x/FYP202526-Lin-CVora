import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../App';

describe('App Component', () => {
  it('should render without crashing', () => {
    render( 
      <MemoryRouter>
        <App />
      </MemoryRouter>
    )
  })

  it('should render the application', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    )
  })
})
