import nextConfig from 'eslint-config-next'

const eslintConfig = [
  ...nextConfig,
  {
    rules: {
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/static-components': 'off',
      'react-hooks/immutability': 'off',
    },
  },
]

export default eslintConfig
