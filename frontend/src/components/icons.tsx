/**
 * icons.tsx — Remplacement centralisé de tous les imports SVG par Font Awesome
 *
 * Usage :
 *   import { IconHome, IconBell, IconMenu } from '../components/icons';
 *   <IconHome size={20} className="nav-icon" />
 *
 * Migration depuis les anciens imports SVG :
 *   - import homeIcon from '../assets/home_1_fill.svg'  →  <IconHome />
 *   - import bellIcon from '../assets/notification_fill.svg'  →  <IconBell />
 *   etc.
 */
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { SizeProp } from '@fortawesome/fontawesome-svg-core';

interface IconProps {
  size?:      number | string;
  className?: string;
  style?:     React.CSSProperties;
  spin?:      boolean;
  pulse?:     boolean;
  title?:     string;
  onClick?:   React.MouseEventHandler<SVGSVGElement>;
}

function px(size?: number | string): SizeProp | undefined {
  if (!size) return undefined;
  // Map numeric sizes to FA size tokens
  const n = typeof size === 'string' ? parseInt(size) : size;
  if (n <= 12) return 'xs';
  if (n <= 16) return 'sm';
  if (n <= 22) return '1x';
  if (n <= 28) return 'lg';
  if (n <= 36) return 'xl';
  return '2x';
}

// ── Navigation ──────────────────────────────────────────────────────────────
export const IconHome        = (p: IconProps) => <FontAwesomeIcon icon={['fas', 'house']}          {...toFa(p)} />;
export const IconFeed        = (p: IconProps) => <FontAwesomeIcon icon={['fas', 'house']}          {...toFa(p)} />;
export const IconMenu        = (p: IconProps) => <FontAwesomeIcon icon={['fas', 'bars']}           {...toFa(p)} />;
export const IconSearch      = (p: IconProps) => <FontAwesomeIcon icon={['fas', 'search']}         {...toFa(p)} />;
export const IconSettings    = (p: IconProps) => <FontAwesomeIcon icon={['fas', 'cog']}            {...toFa(p)} />;
export const IconUser        = (p: IconProps) => <FontAwesomeIcon icon={['fas', 'user']}           {...toFa(p)} />;

// ── Notifications & messagerie ───────────────────────────────────────────────
export const IconBell        = (p: IconProps) => <FontAwesomeIcon icon={['fas', 'bell']}           {...toFa(p)} />;
export const IconBellLine    = (p: IconProps) => <FontAwesomeIcon icon={['far', 'bell']}           {...toFa(p)} />;
export const IconEnvelope    = (p: IconProps) => <FontAwesomeIcon icon={['fas', 'envelope']}       {...toFa(p)} />;
export const IconEnvelopeLine= (p: IconProps) => <FontAwesomeIcon icon={['far', 'envelope']}       {...toFa(p)} />;

// ── Annonces / contenu ───────────────────────────────────────────────────────
export const IconAnnouncement= (p: IconProps) => <FontAwesomeIcon icon={['fas', 'bullhorn']}       {...toFa(p)} />;
export const IconComment     = (p: IconProps) => <FontAwesomeIcon icon={['fas', 'comment']}        {...toFa(p)} />;
export const IconCommentLine = (p: IconProps) => <FontAwesomeIcon icon={['far', 'comment']}        {...toFa(p)} />;
export const IconEye         = (p: IconProps) => <FontAwesomeIcon icon={['fas', 'eye']}            {...toFa(p)} />;
export const IconHeart       = (p: IconProps) => <FontAwesomeIcon icon={['fas', 'heart']}          {...toFa(p)} />;
export const IconHeartLine   = (p: IconProps) => <FontAwesomeIcon icon={['far', 'heart']}          {...toFa(p)} />;
export const IconBookmark    = (p: IconProps) => <FontAwesomeIcon icon={['fas', 'bookmark']}       {...toFa(p)} />;
export const IconBookmarkLine= (p: IconProps) => <FontAwesomeIcon icon={['far', 'bookmark']}       {...toFa(p)} />;
export const IconStar        = (p: IconProps) => <FontAwesomeIcon icon={['fas', 'star']}           {...toFa(p)} />;

// ── Actions ──────────────────────────────────────────────────────────────────
export const IconEdit        = (p: IconProps) => <FontAwesomeIcon icon={['fas', 'edit']}           {...toFa(p)} />;
export const IconDelete      = (p: IconProps) => <FontAwesomeIcon icon={['fas', 'trash']}          {...toFa(p)} />;
export const IconClose       = (p: IconProps) => <FontAwesomeIcon icon={['fas', 'times']}          {...toFa(p)} />;
export const IconCheck       = (p: IconProps) => <FontAwesomeIcon icon={['fas', 'check']}          {...toFa(p)} />;
export const IconCheckCircle = (p: IconProps) => <FontAwesomeIcon icon={['fas', 'check-circle']}   {...toFa(p)} />;
export const IconTimesCircle = (p: IconProps) => <FontAwesomeIcon icon={['fas', 'times-circle']}   {...toFa(p)} />;
export const IconSend        = (p: IconProps) => <FontAwesomeIcon icon={['fas', 'paper-plane']}    {...toFa(p)} />;
export const IconPlus        = (p: IconProps) => <FontAwesomeIcon icon={['fas', 'plus']}           {...toFa(p)} />;
export const IconSignOut     = (p: IconProps) => <FontAwesomeIcon icon={['fas', 'sign-out-alt']}   {...toFa(p)} />;

// ── Utilisateurs ─────────────────────────────────────────────────────────────
export const IconFollow      = (p: IconProps) => <FontAwesomeIcon icon={['fas', 'user-plus']}      {...toFa(p)} />;
export const IconUnfollow    = (p: IconProps) => <FontAwesomeIcon icon={['fas', 'user-minus']}     {...toFa(p)} />;
export const IconGroup       = (p: IconProps) => <FontAwesomeIcon icon={['fas', 'users']}          {...toFa(p)} />;

// ── Visibilité ────────────────────────────────────────────────────────────────
export const IconPublic      = (p: IconProps) => <FontAwesomeIcon icon={['fas', 'eye']}            {...toFa(p)} />;
export const IconGroupVis    = (p: IconProps) => <FontAwesomeIcon icon={['fas', 'users']}          {...toFa(p)} />;
export const IconFullscreen  = (p: IconProps) => <FontAwesomeIcon icon={['fas', 'expand']}         {...toFa(p)} />;
export const IconExitFull   = (p: IconProps) => <FontAwesomeIcon icon={['fas', 'compress']}        {...toFa(p)} />;

// ── Thème ────────────────────────────────────────────────────────────────────
export const IconDarkMode    = (p: IconProps) => <FontAwesomeIcon icon={['fas', 'moon']}           {...toFa(p)} />;
export const IconLightMode   = (p: IconProps) => <FontAwesomeIcon icon={['fas', 'sun']}            {...toFa(p)} />;

// ── Admin ────────────────────────────────────────────────────────────────────
export const IconShield      = (p: IconProps) => <FontAwesomeIcon icon={['fas', 'shield-halved']}  {...toFa(p)} />;

// ── Helper : conversion des props ─────────────────────────────────────────────
function toFa(p: IconProps) {
  return {
    size:       px(p.size),
    className:  p.className,
    style:      p.style as any,
    spin:       p.spin,
    pulse:      p.pulse,
    title:      p.title,
    onClick:    p.onClick,
  };
}

// ── Tableau de correspondance (old SVG → new Icon) ────────────────────────────
/**
 * GUIDE DE MIGRATION
 * ==================
 * Remplacez dans vos pages/composants :
 *
 *   AVANT (import SVG)                           APRÈS (Font Awesome)
 *   ─────────────────────────────────────────────────────────────────
 *   import homeIcon  from '…/home_1_fill.svg'    import { IconHome }        from '../components/icons';
 *   import bellIcon  from '…/notification_fill'  import { IconBell }        from '../components/icons';
 *   import msgIcon   from '…/messenger_fill.svg' import { IconEnvelope }    from '../components/icons';
 *   import menuIcon  from '…/menu_fill.svg'      import { IconMenu }        from '../components/icons';
 *   import settIcon  from '…/settings_1_fill'    import { IconSettings }    from '../components/icons';
 *   import annIcon   from '…/announcement_fill'  import { IconAnnouncement} from '../components/icons';
 *   import commentI  from '…/comment_fill.svg'   import { IconComment }     from '../components/icons';
 *   import deleteI   from '…/delete_2_fill.svg'  import { IconDelete }      from '../components/icons';
 *   import editI     from '…/edite_button.svg'   import { IconEdit }        from '../components/icons';
 *   import closeI    from '…/close_fill.svg'     import { IconClose }       from '../components/icons';
 *   import sendI     from '…/send_plane_fill.svg'import { IconSend }        from '../components/icons';
 *   import moonI     from '…/dark_mode.svg'      import { IconDarkMode }    from '../components/icons';
 *   import sunI      from '…/light_mode.svg'     import { IconLightMode }   from '../components/icons';
 *   import followI   from '…/follow_fill.svg'    import { IconFollow }      from '../components/icons';
 *   import discI     from '…/disconnect_button'  import { IconUnfollow }    from '../components/icons';
 *   import fullI     from '…/fullscreen_2_line'  import { IconFullscreen }  from '../components/icons';
 *   import exitFull  from '…/fullscreen_exit…'   import { IconExitFull }    from '../components/icons';
 *   import checkI    from '…/check_circle_fill'  import { IconCheckCircle } from '../components/icons';
 *   import crossI    from '…/close_line.svg'     import { IconTimesCircle } from '../components/icons';
 *
 * Utilisation dans JSX :
 *   <img src={homeIcon} alt="Accueil" className="nav-icon" />
 *   ↓
 *   <IconHome className="nav-icon" size={20} />
 */
