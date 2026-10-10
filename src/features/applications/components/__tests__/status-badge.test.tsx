import { render, screen } from '@testing-library/react-native';

import { StatusBadge } from '@/features/applications/components/status-badge';

describe('StatusBadge', () => {
  it('zeigt den deutschen Text zum Status', async () => {
    await render(<StatusBadge status="interview" />);

    expect(screen.getByText('Fachgespräch')).toBeOnTheScreen();
  });
});
