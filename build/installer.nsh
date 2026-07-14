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
  ${endif}
!macroend

!macro customInstall
  IfFileExists "$INSTDIR.FBX_Data-update-backup\*.*" 0 restore_data_done

  ClearErrors
  Rename "$INSTDIR.FBX_Data-update-backup" "$INSTDIR\FBX_Data"
  IfErrors 0 restore_data_done
    Abort "Unable to restore FBX_Data after update."

  restore_data_done:
!macroend
