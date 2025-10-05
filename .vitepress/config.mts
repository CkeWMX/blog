import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  base: "/blog/",
  title: "九极实验室",
  description: "九极实验室-文档站",
  head:[
    ["link",{rel: 'icon',href: '/blog/programmer.svg'}]
  ],
  themeConfig: {
    
    returnToTopLabel: '返回顶部',
    outlineTitle: '目录',
    outline: [1,5],
  
    
    
    logo: "/programmer.svg",
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: '首页', link: '/' },
      { text: 'Spring', link: '/springs' },
      // { text: 'Examples', link: '/markdown-examples' }
    ],
    search: {
      provider: "local",
      options: {
        translations: {
          button: {
            buttonText: "搜索",
            buttonAriaLabel: "搜索文档"
          },
          modal: {
            noResultsText: "无相关结果",
            resetButtonTitle: "重置",
            footer:{
              selectText: "选择",
              navigateText: "切换",
              closeText: "关闭"
            }
          }
        }
      }
    },

    sidebar: [
      {
        text: '推荐',
        items: [
          { text: 'Spring全家桶', link: '/springs' },
        ]
      }
    ],

    socialLinks: [
      // { icon: 'github', link: 'https://github.com/vuejs/vitepress' }
    ],
    footer:{
      copyright: "Copyright © 2025 九极实验室. All rights reserved"
    }
  }
})
