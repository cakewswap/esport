import { FooterLinkType } from '@pancakeswap/uikit'
import { ContextApi } from '@pancakeswap/localization'

export const footerLinks: (t: ContextApi['t']) => FooterLinkType[] = (t) => [
  {
    label: t('About'),
    items: [
      {
        label: t('Contact'),
        href: 'https://docs.giannidogeesport.com/',
        isHighlighted: true,
      },
      {
        label: t('Medium'),
        href: 'https://medium.com/@giannidogeesport',
        isHighlighted: true,
      },
    ],
  },
  {
    label: t('Help'),
    items: [
      {
        label: t('Customer Support'),
        href: 'https://docs.giannidogeesport.com/',
      },
    ],
  },
  {
    label: t('Developers'),
    items: [
      {
        label: 'Github',
        href: 'https://github.com/giannidogeesport',
      },
      {
        label: t('Documentation'),
        href: 'https://docs.giannidogeesport.com/',
      },
    ],
  },
]
