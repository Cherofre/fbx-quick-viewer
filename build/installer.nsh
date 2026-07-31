!define FBX_ASSOC_PROGID "FBXQuickViewer.fbx"
!define FBX_ASSOC_CAPABILITIES "Software\Cherofre\FBXQuickViewer\Capabilities"
!define FBX_ASSOC_REGISTERED_NAME "FBX 快速预览器"

!macro customUnInstall
  ${if} ${isUpdated}
    IfFileExists "$INSTDIR\FBX_Data\*.*" 0 preserve_data_done

    IfFileExists "$INSTDIR.FBX_Data-update-backup\*.*" 0 preserve_data_backup_clear
      Abort "A previous FBX_Data update backup already exists."

    preserve_data_backup_clear:
    ClearErrors
    Rename "$INSTDIR\FBX_Data" "$INSTDIR.FBX_Data-update-backup"
    IfErrors 0 preserve_data_done
      Abort "Unable to preserve FBX_Data before update."

    preserve_data_done:
  ${else}
    DeleteRegValue HKCU "Software\Classes\.fbx\OpenWithProgids" "${FBX_ASSOC_PROGID}"
    DeleteRegKey /ifempty HKCU "Software\Classes\.fbx\OpenWithProgids"
    DeleteRegKey /ifempty HKCU "Software\Classes\.fbx"
    DeleteRegKey HKCU "Software\Classes\${FBX_ASSOC_PROGID}"
    DeleteRegKey HKCU "Software\Classes\Applications\fbx-quick-viewer.exe"
    DeleteRegValue HKCU "Software\RegisteredApplications" "${FBX_ASSOC_REGISTERED_NAME}"
    DeleteRegKey HKCU "${FBX_ASSOC_CAPABILITIES}"
    DeleteRegKey /ifempty HKCU "Software\Cherofre\FBXQuickViewer"
    DeleteRegKey /ifempty HKCU "Software\Cherofre"
    System::Call 'shell32::SHChangeNotify(i 0x08000000, i 0, i 0, i 0)'
  ${endif}
!macroend

!macro customInstall
  IfFileExists "$INSTDIR.FBX_Data-update-backup\*.*" 0 restore_data_done

  ClearErrors
  Rename "$INSTDIR.FBX_Data-update-backup" "$INSTDIR\FBX_Data"
  IfErrors 0 restore_data_done
    Abort "Unable to restore FBX_Data after update."

  restore_data_done:
  WriteRegStr HKCU "Software\Classes\${FBX_ASSOC_PROGID}" "" "FBX 模型"
  WriteRegStr HKCU "Software\Classes\${FBX_ASSOC_PROGID}" "FriendlyTypeName" "FBX 模型"
  WriteRegStr HKCU "Software\Classes\${FBX_ASSOC_PROGID}\DefaultIcon" "" "$INSTDIR\${APP_FILENAME}.exe,0"
  WriteRegStr HKCU "Software\Classes\${FBX_ASSOC_PROGID}\shell\open" "FriendlyAppName" "使用 ${FBX_ASSOC_REGISTERED_NAME} 打开"
  WriteRegStr HKCU "Software\Classes\${FBX_ASSOC_PROGID}\shell\open\command" "" "$\"$INSTDIR\${APP_FILENAME}.exe$\" $\"%1$\""
  WriteRegStr HKCU "Software\Classes\.fbx\OpenWithProgids" "${FBX_ASSOC_PROGID}" ""

  WriteRegStr HKCU "Software\Classes\Applications\fbx-quick-viewer.exe" "FriendlyAppName" "${FBX_ASSOC_REGISTERED_NAME}"
  WriteRegStr HKCU "Software\Classes\Applications\fbx-quick-viewer.exe\SupportedTypes" ".fbx" ""
  WriteRegStr HKCU "Software\Classes\Applications\fbx-quick-viewer.exe\shell\open\command" "" "$\"$INSTDIR\${APP_FILENAME}.exe$\" $\"%1$\""

  WriteRegStr HKCU "${FBX_ASSOC_CAPABILITIES}" "ApplicationName" "${FBX_ASSOC_REGISTERED_NAME}"
  WriteRegStr HKCU "${FBX_ASSOC_CAPABILITIES}" "ApplicationDescription" "快速预览 FBX 三维模型"
  WriteRegStr HKCU "${FBX_ASSOC_CAPABILITIES}\FileAssociations" ".fbx" "${FBX_ASSOC_PROGID}"
  WriteRegStr HKCU "Software\RegisteredApplications" "${FBX_ASSOC_REGISTERED_NAME}" "${FBX_ASSOC_CAPABILITIES}"
  System::Call 'shell32::SHChangeNotify(i 0x08000000, i 0, i 0, i 0)'
!macroend
