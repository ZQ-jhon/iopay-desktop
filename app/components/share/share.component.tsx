import { styled } from 'onefx/lib/styletron-react';
import { colors } from '../../constants/colors';

export const CommonMarginComponent = styled('div', () => ({
  margin: '16px',
}));

export const WalletTitleComponent = styled('h2', {
  fontWeight: 'bold',
});

export const StyleLinkComponent = styled('span', {
  color: colors.primary,
});

export const FormLabelComponent = styled('label', {
  fontWeight: 'bold',
});
