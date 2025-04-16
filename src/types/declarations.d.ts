declare module "@radix-ui/react-dialog" {
  export interface DialogProps {
    children?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
  }

  export interface DialogTriggerProps {
    children?: React.ReactNode;
    asChild?: boolean;
  }

  export interface DialogContentProps {
    children?: React.ReactNode;
    onOpenAutoFocus?: (event: Event) => void;
    onCloseAutoFocus?: (event: Event) => void;
    onEscapeKeyDown?: (event: KeyboardEvent) => void;
    onPointerDownOutside?: (event: Event) => void;
    onInteractOutside?: (event: Event) => void;
  }

  export const Dialog: React.FC<DialogProps>;
  export const DialogTrigger: React.FC<DialogTriggerProps>;
  export const DialogContent: React.FC<DialogContentProps>;
  export const DialogClose: React.FC<{ children?: React.ReactNode }>;
  export const DialogTitle: React.FC<{ children?: React.ReactNode }>;
  export const DialogDescription: React.FC<{ children?: React.ReactNode }>;
}

declare module "@/components/ui/button" {
  export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
    size?: 'default' | 'sm' | 'lg' | 'icon';
    className?: string;
    onClick?: () => void;
    type?: 'button' | 'submit' | 'reset';
    disabled?: boolean;
    children?: React.ReactNode;
  }

  export const Button: React.FC<ButtonProps>;
}

declare interface Profile {
  id: string;
  full_name: string | null;
  date_of_birth: string | null;
  avatar_url: string | null;
  bio: string | null;
  phone: string | null;
  is_admin?: boolean;
}

declare interface Club {
  id: string;
  name: string;
  description: string;
  category: string;
  meeting_time: string;
  location: string;
  email: string;
  website: string;
  image_url: string;
  created_by?: string;
}

declare interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  club_id: string | null;
  capacity: number;
  image_url: string;
  created_by: string;
}

declare interface Announcement {
  id: string;
  title: string;
  content: string;
  created_at: string;
  created_by: string;
  priority: 'low' | 'medium' | 'high';
}

declare interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

declare interface AuthModalProps extends BaseModalProps {
  initialMode?: 'signin' | 'signup' | 'reset';
}

declare interface EditProfileModalProps extends BaseModalProps {}

declare interface CreateEventModalProps extends BaseModalProps {}

declare interface EditEventModalProps extends BaseModalProps {
  event: Event | null;
}

declare interface CreateClubModalProps extends BaseModalProps {}

declare interface EditClubModalProps extends BaseModalProps {
  club: Club | null;
}

declare interface CreateAnnouncementModalProps extends BaseModalProps {}

declare interface EditAnnouncementModalProps extends BaseModalProps {
  announcement: Announcement | null;
} 