import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';
import PollCard from './components/PollCard';

test('renders the live polling dashboard', () => {
  render(<App />);

  expect(screen.getByText(/create a live poll/i)).toBeInTheDocument();
  expect(screen.getByText(/explore polls/i)).toBeInTheDocument();
});

test('demo poll vote updates locally without backend call', () => {
  const poll = {
    id: 'demo-poll-language-choice',
    question: 'Which coding language would you choose if you could learn only ONE?',
    options: [
      { id: 'python', text: 'Python 🐍', votes: 0 },
      { id: 'java', text: 'Java ☕', votes: 0 },
      { id: 'cpp', text: 'C++ ⚡', votes: 0 },
      { id: 'javascript', text: 'JavaScript 🌐', votes: 0 },
    ],
  };

  render(<PollCard poll={poll} onVoted={() => {}} />);

  fireEvent.click(screen.getByRole('button', { name: /python/i }));

  expect(screen.getByText(/1 votes/i)).toBeInTheDocument();
});
