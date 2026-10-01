module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx}', './design-reference/**/*.html'],
  theme: {
    extend: {
      colors: {
        tertiary:'#005b7c','surface-container-high':'#dce9ff','on-error-container':'#93000a','on-error':'#ffffff','secondary-container':'#dae2fd','on-primary-fixed-variant':'#003ea8','on-secondary-container':'#5c647a','on-primary':'#ffffff','surface-container-low':'#eff4ff','tertiary-fixed-dim':'#7bd0ff','on-secondary-fixed':'#131b2e','surface-variant':'#d3e4fe','on-background':'#0b1c30','on-primary-fixed':'#00174b','error-container':'#ffdad6','primary-fixed-dim':'#b4c5ff','on-surface-variant':'#434655','surface-container':'#e5eeff','on-tertiary-container':'#e1f2ff','on-surface':'#0b1c30','surface-container-lowest':'#ffffff','primary-container':'#2563eb',primary:'#004ac6','primary-fixed':'#dbe1ff','on-tertiary-fixed-variant':'#004c69','secondary-fixed':'#dae2fd',outline:'#737686','secondary-fixed-dim':'#bec6e0','inverse-surface':'#213145','on-tertiary':'#ffffff',secondary:'#565e74','on-secondary-fixed-variant':'#3f465c','on-tertiary-fixed':'#001e2c','on-secondary':'#ffffff','outline-variant':'#c3c6d7', 'surface-bright':'#f8f9ff','tertiary-container':'#00759f','on-primary-container':'#eeefff',error:'#ba1a1a','tertiary-fixed':'#c4e7ff','surface-tint':'#0053db','inverse-on-surface':'#eaf1ff',surface:'#f8f9ff','inverse-primary':'#b4c5ff',background:'#f8f9ff','surface-container-highest':'#d3e4fe','surface-dim':'#cbdbf5'
      },
      borderRadius:{DEFAULT:'0.125rem',lg:'0.25rem',xl:'0.5rem',full:'0.75rem'},
      spacing:{margin:'2rem','space-xs':'0.25rem','space-lg':'1.5rem','margin-mobile':'1rem','space-md':'1rem','space-xl':'2rem','space-sm':'0.5rem',gutter:'1.5rem','gutter-mobile':'0.75rem'},
      fontFamily:Object.fromEntries(['code-snippet','body-sm','display-hero-mobile','headline-lg','label-sm','headline-md','body-lg','body-md','display-hero','label-md','headline-sm'].map(name=>[name,['Inter','Pretendard','sans-serif']])),
      fontSize:{'code-snippet':['13px',{lineHeight:'20px',fontWeight:'400'}],'body-sm':['13px',{lineHeight:'18px',fontWeight:'400'}],'display-hero-mobile':['26px',{lineHeight:'36px',fontWeight:'700'}],'headline-lg':['24px',{lineHeight:'32px',fontWeight:'700'}],'label-sm':['11px',{lineHeight:'14px',fontWeight:'500'}],'headline-md':['20px',{lineHeight:'28px',fontWeight:'600'}],'body-lg':['16px',{lineHeight:'26px',fontWeight:'400'}],'body-md':['14px',{lineHeight:'22px',fontWeight:'400'}],'display-hero':['36px',{lineHeight:'48px',fontWeight:'800'}],'label-md':['13px',{lineHeight:'16px',fontWeight:'500'}],'headline-sm':['16px',{lineHeight:'24px',fontWeight:'600'}]}
    }
  }
};
