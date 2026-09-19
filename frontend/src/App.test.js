import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';
import PollCard from './components/PollCard';
import { castVote } from './api/polls';

jest.mock('./api/polls', () => ({
  castVote: jest.fn(),
  listPolls: jest.fn(),
  createPoll: jest.fn(),
  getPoll: jest.fn(),
}));

test('renders the live polling dashboard', () => {
  render(<App />);

  expect(screen.getByText(/create a live poll/i)).toBeInTheDocument();
  expect(screen.getByText(/explore polls/i)).toBeInTheDocument();
});

test('poll votes are persisted via the backend API', async () => {
  const poll = {
    id: '507f1f77bcf86cd799439011',
    question: 'Which coding language would you choose if you could learn only ONE?',
    options: [
      { id: 'python', text: 'Python 🐍', votes: 0 },
      { id: 'java', text: 'Java ☕', votes: 0 },
      { id: 'cpp', text: 'C++ ⚡', votes: 0 },
      { id: 'javascript', text: 'JavaScript 🌐', votes: 0 },
    ],
  };

  castVote.mockResolvedValue({
    ...poll,
    options: poll.options.map((opt) =>
      opt.id === 'python' ? { ...opt, votes: 1 } : opt
    ),
  });

  render(<PollCard poll={poll} onVoted={() => {}} />);

  fireEvent.click(screen.getByRole('button', { name: /python/i }));

  await waitFor(() => {
    expect(castVote).toHaveBeenCalledWith({ poll_id: poll.id, option_id: 'python' });
  });
});
