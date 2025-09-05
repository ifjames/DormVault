import Swal from 'sweetalert2';

// Modern notification utility using SweetAlert2
export const notify = {
  success: (title: string, text?: string) => {
    return Swal.fire({
      icon: 'success',
      title,
      text,
      timer: 3000,
      timerProgressBar: true,
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      customClass: {
        popup: 'swal-modern-notification swal-success',
        title: 'swal-title',
        htmlContainer: 'swal-text'
      },
      backdrop: false,
      allowEnterKey: false,
      allowEscapeKey: false,
      allowOutsideClick: true,
      showClass: {
        popup: 'animate__animated animate__slideInRight animate__faster'
      },
      hideClass: {
        popup: 'animate__animated animate__slideOutRight animate__faster'
      }
    });
  },

  error: (title: string, text?: string) => {
    return Swal.fire({
      icon: 'error',
      title,
      text,
      timer: 5000,
      timerProgressBar: true,
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      customClass: {
        popup: 'swal-modern-notification swal-error',
        title: 'swal-title',
        htmlContainer: 'swal-text'
      },
      backdrop: false,
      allowEnterKey: false,
      allowEscapeKey: false,
      allowOutsideClick: true,
      showClass: {
        popup: 'animate__animated animate__slideInRight animate__faster'
      },
      hideClass: {
        popup: 'animate__animated animate__slideOutRight animate__faster'
      }
    });
  },

  warning: (title: string, text?: string) => {
    return Swal.fire({
      icon: 'warning',
      title,
      text,
      timer: 4000,
      timerProgressBar: true,
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      customClass: {
        popup: 'swal-modern-notification swal-warning',
        title: 'swal-title',
        htmlContainer: 'swal-text'
      },
      backdrop: false,
      allowEnterKey: false,
      allowEscapeKey: false,
      allowOutsideClick: true,
      showClass: {
        popup: 'animate__animated animate__slideInRight animate__faster'
      },
      hideClass: {
        popup: 'animate__animated animate__slideOutRight animate__faster'
      }
    });
  },

  info: (title: string, text?: string) => {
    return Swal.fire({
      icon: 'info',
      title,
      text,
      timer: 3500,
      timerProgressBar: true,
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      customClass: {
        popup: 'swal-modern-notification swal-info',
        title: 'swal-title',
        htmlContainer: 'swal-text'
      },
      backdrop: false,
      allowEnterKey: false,
      allowEscapeKey: false,
      allowOutsideClick: true,
      showClass: {
        popup: 'animate__animated animate__slideInRight animate__faster'
      },
      hideClass: {
        popup: 'animate__animated animate__slideOutRight animate__faster'
      }
    });
  }
};

// Modern modal/alert utility 
export const modal = {
  confirm: async (title: string, text?: string, confirmText: string = 'Yes', cancelText: string = 'Cancel') => {
    const result = await Swal.fire({
      title,
      text,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: confirmText,
      cancelButtonText: cancelText,
      customClass: {
        popup: 'swal-modern-modal',
        confirmButton: 'swal-confirm-button',
        cancelButton: 'swal-cancel-button',
        title: 'swal-modal-title',
        htmlContainer: 'swal-modal-text'
      },
      buttonsStyling: false,
      reverseButtons: true,
      focusConfirm: false,
      allowOutsideClick: false,
      allowEscapeKey: true,
      showClass: {
        popup: 'animate__animated animate__zoomIn animate__faster'
      },
      hideClass: {
        popup: 'animate__animated animate__zoomOut animate__faster'
      }
    });
    return result.isConfirmed;
  },

  alert: (title: string, text?: string, icon: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    return Swal.fire({
      title,
      text,
      icon,
      confirmButtonText: 'OK',
      customClass: {
        popup: 'swal-modern-modal',
        confirmButton: 'swal-confirm-button',
        title: 'swal-modal-title',
        htmlContainer: 'swal-modal-text'
      },
      buttonsStyling: false,
      allowOutsideClick: false,
      allowEscapeKey: true,
      showClass: {
        popup: 'animate__animated animate__zoomIn animate__faster'
      },
      hideClass: {
        popup: 'animate__animated animate__zoomOut animate__faster'
      }
    });
  },

  input: async (title: string, text?: string, inputPlaceholder?: string) => {
    const result = await Swal.fire({
      title,
      text,
      input: 'text',
      inputPlaceholder,
      showCancelButton: true,
      confirmButtonText: 'Submit',
      cancelButtonText: 'Cancel',
      customClass: {
        popup: 'swal-modern-modal',
        confirmButton: 'swal-confirm-button',
        cancelButton: 'swal-cancel-button',
        title: 'swal-modal-title',
        htmlContainer: 'swal-modal-text',
        input: 'swal-modern-input'
      },
      buttonsStyling: false,
      reverseButtons: true,
      allowOutsideClick: false,
      allowEscapeKey: true,
      showClass: {
        popup: 'animate__animated animate__zoomIn animate__faster'
      },
      hideClass: {
        popup: 'animate__animated animate__zoomOut animate__faster'
      },
      inputValidator: (value) => {
        if (!value) {
          return 'Please enter a value';
        }
        return null;
      }
    });
    return result.isConfirmed ? result.value : null;
  },

  loading: (title: string = 'Loading...', text?: string) => {
    Swal.fire({
      title,
      text,
      customClass: {
        popup: 'swal-modern-modal',
        title: 'swal-modal-title',
        htmlContainer: 'swal-modal-text'
      },
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
  },

  close: () => {
    Swal.close();
  }
};

// Configure global SweetAlert2 settings
Swal.mixin({
  customClass: {
    container: 'swal-container'
  }
});