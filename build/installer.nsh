!macro customGUIInit
  ; Windows 11 & 10 DWM Immersive Dark Mode
  System::Call 'dwmapi::DwmSetWindowAttribute(i $HWNDPARENT, i 20, *i 1, i 4)'
  System::Call 'dwmapi::DwmSetWindowAttribute(i $HWNDPARENT, i 19, *i 1, i 4)'
  ; Force titlebar to dark charcoal (#09090b in BGR)
  System::Call 'dwmapi::DwmSetWindowAttribute(i $HWNDPARENT, i 35, *i 0x000B0909, i 4)'
  ; Force titlebar text to white (#f4f4f5 in BGR)
  System::Call 'dwmapi::DwmSetWindowAttribute(i $HWNDPARENT, i 36, *i 0x00F5F4F4, i 4)'
  SetCtlColors $HWNDPARENT 0xF4F4F5 0x09090B
!macroend

!macro customUnGUIInit
  System::Call 'dwmapi::DwmSetWindowAttribute(i $HWNDPARENT, i 20, *i 1, i 4)'
  System::Call 'dwmapi::DwmSetWindowAttribute(i $HWNDPARENT, i 19, *i 1, i 4)'
  System::Call 'dwmapi::DwmSetWindowAttribute(i $HWNDPARENT, i 35, *i 0x000B0909, i 4)'
  System::Call 'dwmapi::DwmSetWindowAttribute(i $HWNDPARENT, i 36, *i 0x00F5F4F4, i 4)'
  SetCtlColors $HWNDPARENT 0xF4F4F5 0x09090B
!macroend
