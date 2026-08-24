// Central color palette. Swap these values later for dark mode support
// or a real brand palette — every screen reads from here, nothing is
// hardcoded inline.
export const colors = {
  surface0: "#F7F7F5",
  surface1: "#FFFFFF",
  surface2: "#FFFFFF",
  border: "#E5E4DF",
  borderAccent: "#378ADD",

  textPrimary: "#1A1A18",
  textSecondary: "#5F5E5A",
  textMuted: "#888780",

  bgAccent: "#E6F1FB",
  textAccent: "#185FA5",

  bgDanger: "#FCEBEB",
  textDanger: "#A32D2D",

  bgWarning: "#FDF3E1",
  textWarning: "#8A5A00",

  bgSuccess: "#EAF3DE",
  textSuccess: "#3B6D11",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};

export const radius = {
  control: 8,
  card: 12,
  lg: 18,
  pill: 999,
};

// Shared elevation tokens so cards read as distinct surfaces instead
// of flat rectangles with a hairline border. `card` for anything
// sitting directly on the screen background; `raised` for the one
// thing per screen that should read as most important (the map,
// a modal sheet).
export const shadows = {
  card: {
    shadowColor: "#14202B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  raised: {
    shadowColor: "#14202B",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
};

// Small reusable text treatment for section eyebrows / labels, so
// "YOUR ROUTES" and "LEAVE BY 8:52AM" share one deliberate look
// instead of each screen inventing its own.
export const eyebrow = {
  fontSize: 11,
  fontWeight: "700",
  letterSpacing: 0.6,
  textTransform: "uppercase",
};
