/// <reference types="vitest/globals" />
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CVBuilder } from '../pages/CVBuilder';


// Wrap in MemoryRouter because CVBuilder uses useNavigate
const renderCVBuilder = () => render(
    <MemoryRouter>
        <CVBuilder />
    </MemoryRouter>
);

describe('CVBuilder', () => {

    test('renders the page heading', () => {
        renderCVBuilder();
        expect(screen.getByText('Build your')).toBeInTheDocument();
    });

    test('renders the first step — Personal Information', () => {
        renderCVBuilder();
        expect(screen.getByText('Personal Information')).toBeInTheDocument();
    });

    test('renders the stepper with Personal label', () => {
        renderCVBuilder();
        expect(screen.getByText('Personal')).toBeInTheDocument();
    });

    test('renders the Preview CV button', () => {
        renderCVBuilder();
        const elements = screen.getAllByText('CV Preview');
        
    expect(elements.length).toBeGreaterThan(0);
    });

    test('renders the AI Assistant button', () => {
        renderCVBuilder();
        expect(screen.getByText('AI Chat')).toBeInTheDocument();
    });

    test('renders the Next navigation button', () => {
        renderCVBuilder();
        expect(screen.getByText('Next')).toBeInTheDocument();
    });

    test('renders the Back to Home link', () => {
        renderCVBuilder();
        expect(screen.getByText('Back to Home')).toBeInTheDocument();
    });

    test('Back button is disabled on first step', () => {
        renderCVBuilder();
        const backButton = screen.getByText('Back').closest('button');
        expect(backButton).toBeDisabled();
    });

});