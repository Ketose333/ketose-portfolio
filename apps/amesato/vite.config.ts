import tailwindcss from '@tailwindcss/vite'
import { createReactAppConfig } from '../../configs/vite/react-app'

export default createReactAppConfig({
  plugins: [tailwindcss()],
})
