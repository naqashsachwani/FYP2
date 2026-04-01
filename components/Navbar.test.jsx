import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Navbar from './Navbar';

// =========================================================
// 1. SETUP MOCKS (Faking Clerk, Next.js Router, and Fetch)
// =========================================================

// Fake the Next.js Router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Fake Clerk Authentication
const mockOpenSignIn = jest.fn();
let mockUserState = { user: null }; // We will change this in different tests

jest.mock('@clerk/nextjs', () => ({
  useUser: () => mockUserState,
  useClerk: () => ({
    openSignIn: mockOpenSignIn,
    openUserProfile: jest.fn(),
    signOut: jest.fn(),
  }),
}));

// Fake the global fetch API (for your isAdmin and isSeller checks)
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ isAdmin: false, isSeller: false }),
  })
);

// =========================================================
// 2. WRITE THE TESTS
// =========================================================

describe('Navbar Component', () => {
  // Clear all fake data before each test runs
  beforeEach(() => {
    jest.clearAllMocks();
  });

 // --- TEST 1: Basic Rendering ---
  it('should render the DreamSaver logo and main navigation links', () => {
    mockUserState = { user: null }; // Simulate logged out
    render(<Navbar />);

    // Check if the logo text exists
    expect(screen.getByText(/Dream/i)).toBeInTheDocument();
    expect(screen.getByText(/Saver/i)).toBeInTheDocument();

    // Check if basic links exist (They appear twice: Desktop and Mobile)
    const homeLinks = screen.getAllByRole('link', { name: /Home/i });
    expect(homeLinks.length).toBe(2);

    const shopLinks = screen.getAllByRole('link', { name: /Shop/i });
    expect(shopLinks.length).toBe(2);

    const aboutLinks = screen.getAllByRole('link', { name: /About/i });
    expect(aboutLinks.length).toBe(2);
    
    const contactLinks = screen.getAllByRole('link', { name: /Contact/i });
    expect(contactLinks.length).toBe(2);
  });

  // --- TEST 2: Unauthenticated State (Logged Out) ---
  it('should show the "Sign In" button when the user is not logged in', async () => {
    mockUserState = { user: null }; // Simulate logged out
    render(<Navbar />);

    // Because your component uses a `mounted` state in useEffect, 
    // we use `waitFor` to wait for React to finish mounting
    await waitFor(() => {
      // Look for the desktop Sign In button
      const signInButtons = screen.getAllByRole('button', { name: /Sign In/i });
      expect(signInButtons.length).toBeGreaterThan(0);
    });

    // Test if clicking it triggers Clerk's sign-in modal
    const desktopSignInBtn = screen.getAllByRole('button', { name: /Sign In/i })[0];
    fireEvent.click(desktopSignInBtn);
    expect(mockOpenSignIn).toHaveBeenCalledTimes(1);
  });

  // --- TEST 3: Search Functionality ---
  it('should trigger router.push when a search is submitted', async () => {
    mockUserState = { user: null };
    render(<Navbar />);

    // Find the desktop search input
    const searchInput = screen.getByPlaceholderText(/Search products.../i);
    
    // Simulate a user typing "laptop"
    fireEvent.change(searchInput, { target: { value: 'laptop' } });
    
    // Simulate hitting "Enter" (submitting the form)
    fireEvent.submit(searchInput.closest('form'));

    // Assert that Next.js router tried to redirect us to the correct URL
    expect(mockPush).toHaveBeenCalledWith('/shop?search=laptop');
  });

  // --- TEST 4: Authenticated State (Logged In) ---
  it('should show the user profile image when logged in', async () => {
    // Simulate a logged-in user
    mockUserState = {
      user: {
        fullName: 'Naqash Sachwani',
        imageUrl: 'https://fake-image.com/avatar.jpg',
        primaryEmailAddress: { emailAddress: 'test@test.com' },
      },
    };
    
    render(<Navbar />);

    await waitFor(() => {
      // The "Sign In" button should NOT be there
      expect(screen.queryByRole('button', { name: /Sign In/i })).not.toBeInTheDocument();

      // The User's avatar image should be on the screen
      const userImage = screen.getByAltText(/Naqash Sachwani/i);
      expect(userImage).toBeInTheDocument();
      expect(userImage).toHaveAttribute('src', 'https://fake-image.com/avatar.jpg');
    });
  });

});