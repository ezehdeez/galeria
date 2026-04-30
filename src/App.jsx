import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X, Heart } from "lucide-react";
import {
  intervalToDuration,
} from "date-fns";
import { galleryData } from "./data/galleryData";

// -----------------------------------------------------------------------------
// Notas de ESLint
// La librería framer-motion expone el objeto `motion` que se utiliza en JSX
// (`<motion.div>`, `<motion.button>`, etc.). Sin embargo, ESLint a veces no
// detecta este uso y marca la variable como no utilizada. Asignamos el objeto a
// una constante para que cuente como usado y así evitar falsos positivos de
// la regla `no-unused-vars`.
const _motionIsUsed = motion;
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return isMobile;
}

// ─── CONFIGURACIÓN ────────────────────────────────────────────────────────────
const START_DATE = new Date(2023, 2, 26);
// Utilizamos una pieza de piano más tranquila para un ambiente de aniversario.
const AUDIO_URL = "/galeria/audio/theme.mp3";

// ─── DATOS: FOTOS + TEXTO PERSONALIZADO ───────────────────────────────────────
// Cambia las URLs por tus propias fotos y los captions por tus textos
// ─── VARIANTES CAÓTICAS DE COLOCACIÓN ────────────────────────────────────────
// rotate: grados, w×h: tamaño del marco, offsetY: desplazamiento vertical,
// shape: "normal" | "horizontal" | "oval"
const PHOTO_VARIANTS = [
  { rotate: -5, w: 165, h: 220, offsetY: -8, shape: "normal" },
  { rotate: 3, w: 230, h: 160, offsetY: 6, shape: "horizontal" },
  { rotate: -2, w: 160, h: 205, offsetY: 4, shape: "oval" },
  { rotate: 4, w: 175, h: 225, offsetY: -5, shape: "normal" },
  { rotate: -3, w: 210, h: 155, offsetY: 7, shape: "horizontal" },
  { rotate: 2, w: 165, h: 215, offsetY: -6, shape: "normal" },
];

// ─── CSS GLOBAL ───────────────────────────────────────────────────────────────
const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=Lato:wght@300;400;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Lato', sans-serif; background: #FAFAFA; overflow: hidden; }
  .font-heading { font-family: 'Playfair Display', serif; }
  .font-body    { font-family: 'Lato', sans-serif; }
  @keyframes pulse-slow { 0%,100%{opacity:1} 50%{opacity:0.5} }
  .animate-pulse-slow { animation: pulse-slow 2.5s ease-in-out infinite; }
`;

// ─── MARCO DE MADERA REALISTA ─────────────────────────────────────────────────
function WoodFrame({ children, shape, width, height }) {
  const isOval = shape === "oval";
  const r = isOval ? "50%" : "2px";
  return (
    <div
      style={{
        width,
        height,
        borderRadius: r,
        // Madera oscura con veta simulada
        background: `
          repeating-linear-gradient(
            86deg,
            rgba(255,255,255,0.018) 0px, rgba(255,255,255,0.018) 1px,
            transparent 1px, transparent 7px
          ),
          linear-gradient(170deg, #5C3A1A 0%, #3A1F08 30%, #6A4020 55%, #2D1804 78%, #4B2B10 100%)
        `,
        padding: "13px",
        boxShadow:
          "0 14px 45px rgba(0,0,0,0.6), " +
          "inset 0 0 0 3px rgba(0,0,0,0.4), " +
          "inset 0 0 0 5px rgba(255,255,255,0.05), " +
          "inset 0 2px 4px rgba(255,255,255,0.1)",
        position: "relative",
        flexShrink: 0,
      }}
    >
      {/* Borde dorado interior (passepartout) */}
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: isOval ? "50%" : "1px",
          border: "2px solid #7A5C10",
          boxShadow: "inset 0 0 10px rgba(0,0,0,0.7)",
          overflow: "hidden",
        }}
      >
        {/* Passepartout crema */}
        <div
          style={{
            width: "100%",
            height: "100%",
            background: "#F2E8CE",
            padding: "7px",
            overflow: "hidden",
          }}
        >
          {children}
        </div>
      </div>
      {/* Reflejo de luz en el marco superior */}
      <div
        style={{
          position: "absolute",
          top: 0, left: 0, right: 0,
          height: "35%",
          borderRadius: `${r} ${r} 0 0`,
          background: "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, transparent 100%)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}

// ─── LIGHTBOX ─────────────────────────────────────────────────────────────────
function Lightbox({ photo, onClose }) {
  return (
    <AnimatePresence>
      {photo && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: "fixed", inset: 0, zIndex: 200,
            background: "rgba(0,0,0,0.9)",
            display: "flex",
            flexDirection: window.innerWidth <= 768 ? "column" : "row",
            alignItems: "stretch",
            justifyContent: "center",
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.86 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.86 }}
            transition={{ type: "spring", damping: 26, stiffness: 280 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              display: "flex",
              alignItems: "stretch",
              maxWidth: "84vw",
              maxHeight: "80vh",
              borderRadius: "4px",
              overflow: "hidden",
              boxShadow: "0 40px 90px rgba(0,0,0,0.8)",
            }}
          >
            {/* Imagen */}
            <img
              src={photo.url}
              alt="Foto ampliada"
              style={{
                display: "block",
                maxWidth: window.innerWidth <= 768 ? "92vw" : "58vw",
                maxHeight: window.innerWidth <= 768 ? "58vh" : "80vh",
                objectFit: "cover",
              }}
            />
            {/* Panel lateral con texto */}
            <div
              style={{
                width: window.innerWidth <= 768 ? "92vw" : 260,
                minWidth: window.innerWidth <= 768 ? "auto" : 220,
                background: "#180E04",
                display: "flex", flexDirection: "column",
                justifyContent: "center",
                padding: "2.5rem 1.8rem",
              }}
            >
              <div
                style={{
                  width: 36, height: 2,
                  background: "linear-gradient(90deg, #D4AF37, #8B6914)",
                  marginBottom: "1.4rem",
                }}
              />
              <p
                className="font-heading"
                style={{
                  fontSize: "1.1rem",
                  fontStyle: "italic",
                  color: "#EDD88A",
                  lineHeight: 1.7,
                }}
              >
                "{photo.caption}"
              </p>
              <div
                style={{
                  width: 36, height: 2,
                  background: "linear-gradient(90deg, #8B6914, #D4AF37)",
                  marginTop: "1.4rem",
                  alignSelf: "flex-end",
                }}
              />
            </div>
          </motion.div>

          {/* Botón cerrar */}
          <button
            onClick={onClose}
            style={{
              position: "fixed", top: 22, right: 26, zIndex: 201,
              width: 34, height: 34, borderRadius: "50%",
              border: "1px solid rgba(255,255,255,0.18)",
              background: "rgba(255,255,255,0.07)",
              color: "#bbb", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <X size={17} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── WELCOME ──────────────────────────────────────────────────────────────────
function WelcomeOverlay({ isVisible, onEnter }) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          style={{
            position: "fixed", inset: 0, zIndex: 100,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "radial-gradient(ellipse at center, rgba(255,255,255,0.97) 0%, rgba(250,250,250,0.99) 100%)",
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            style={{ textAlign: "center", padding: "0 2rem", maxWidth: "42rem" }}
          >
            <motion.h1
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: 0.35, duration: 0.7 }}
              className="font-heading"
              style={{ fontSize: "clamp(2.5rem,7vw,5rem)", color: "#D4AF37", marginBottom: "2rem" }}
            >
              Galería 1095
            </motion.h1>
            <motion.div
              initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
              transition={{ delay: 0.65, duration: 0.8 }}
              style={{
                width: 128, height: 1, margin: "0 auto 2.5rem",
                background: "linear-gradient(90deg, transparent, #D4AF37, transparent)",
              }}
            />
            <motion.button
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.85, duration: 0.5 }}
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
              onClick={onEnter}
              className="font-body"
              style={{
                padding: "0.875rem 2.5rem", borderRadius: 50,
                border: "none", cursor: "pointer",
                fontSize: "1rem", fontWeight: 600, color: "#fff",
                background: "linear-gradient(135deg, #D4AF37 0%, #B8860B 100%)",
                boxShadow: "0 4px 20px rgba(212,175,55,0.4)",
                letterSpacing: "0.05em",
              }}
            >
              Entrar al Museo
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function RoomDecor({ isMobile }) {
  if (isMobile) {
    return null;
  }
  const pilasterStyle = (side) => ({
    position: "absolute",
    top: isMobile ? 20 : 48,
    bottom: isMobile ? 20 : 48,
    [side]: isMobile ? 8 : 48,
    width: isMobile ? 16 : 40,
    borderRadius: "18px",
    background: `
      linear-gradient(
        90deg,
        rgba(255,255,255,0.86) 0%,
        rgba(239,226,205,0.94) 24%,
        rgba(198,170,124,0.48) 52%,
        rgba(239,226,205,0.94) 78%,
        rgba(255,255,255,0.78) 100%
      )
    `,
    boxShadow: `
      inset 8px 0 14px rgba(255,255,255,0.42),
      inset -8px 0 16px rgba(95,62,32,0.14),
      0 14px 28px rgba(70,45,22,0.10)
    `,
    opacity: isMobile ? 0.22 : 0.38,
    pointerEvents: "none",
    zIndex: 0,
  });

  const capStyle = (side, vertical) => ({
    position: "absolute",
    [side]: isMobile ? 4 : 40,
    [vertical]: isMobile ? 14 : 38,
    width: isMobile ? 24 : 56,
    height: isMobile ? 7 : 11,
    borderRadius: "999px",
    background: "linear-gradient(180deg, #fff7e7 0%, #c8aa74 100%)",
    boxShadow: "0 8px 18px rgba(90,60,30,0.10)",
    opacity: isMobile ? 0.25 : 0.42,
    pointerEvents: "none",
    zIndex: 1,
  });

  const lampStyle = (side) => ({
    position: "absolute",
    top: isMobile ? 74 : 116,
    [side]: isMobile ? 30 : 108,
    width: isMobile ? 34 : 54,
    height: isMobile ? 46 : 62,
    pointerEvents: "none",
    zIndex: 2,
  });

  return (
    <>
      <div style={pilasterStyle("left")} />
      <div style={pilasterStyle("right")} />
      <div style={capStyle("left", "top")} />
      <div style={capStyle("left", "bottom")} />
      <div style={capStyle("right", "top")} />
      <div style={capStyle("right", "bottom")} />

      {["left", "right"].map((side) => (
        <div key={side} style={lampStyle(side)}>
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: isMobile ? 4 : 2,
              transform: "translateX(-50%)",
              width: isMobile ? 62 : 92,
              height: isMobile ? 62 : 92,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(255,210,110,0.28) 0%, rgba(255,210,110,0.10) 38%, transparent 72%)",
              filter: "blur(2px)",
            }}
          />

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 0,
              transform: "translateX(-50%)",
              width: isMobile ? 28 : 38,
              height: isMobile ? 24 : 30,
              borderRadius: "50% 50% 42% 42%",
              background: "linear-gradient(180deg, #ffe7a3 0%, #d6a94b 55%, #8b5b1f 100%)",
              boxShadow: `
                inset 0 3px 8px rgba(255,255,255,0.45),
                inset 0 -6px 10px rgba(70,40,10,0.22),
                0 0 20px rgba(255,198,85,0.40)
              `,
            }}
          />

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: isMobile ? 23 : 29,
              transform: "translateX(-50%)",
              width: isMobile ? 5 : 6,
              height: isMobile ? 24 : 32,
              borderRadius: "999px",
              background: "linear-gradient(180deg, #b98b3a 0%, #5a3410 100%)",
              boxShadow: "inset 1px 0 2px rgba(255,255,255,0.25)",
            }}
          />

          <div
            style={{
              position: "absolute",
              left: "50%",
              bottom: 0,
              transform: "translateX(-50%)",
              width: isMobile ? 18 : 24,
              height: isMobile ? 7 : 9,
              borderRadius: "999px",
              background: "linear-gradient(180deg, #d0a14a 0%, #704010 100%)",
              boxShadow: "0 4px 8px rgba(70,40,10,0.18)",
            }}
          />
        </div>
      ))}
    </>
  );
}

// ─── SALA DEL MUSEO ───────────────────────────────────────────────────────────
function MuseumRoom({ photos, roomIndex, isActive, onPhotoClick }) {
  const isMobile = useIsMobile();

  const W = isMobile ? 94 : 68;
  const H = isMobile ? 92 : 78;
  const wallL = (100 - W) / 2;  // 16
  const wallR = wallL + W;       // 84
  const wallT = (100 - H) / 2;  // 11
  const wallB = wallT + H;       // 89

  // Generamos una variante diferente de disposiciones para cada sala girando
  // el array de variantes en función del índice de la sala. Así, la
  // disposición (rotación, tamaño y forma) de los marcos cambia de una sala a
  // otra y hace que cada galería se sienta única.
  const rotatedVariants = PHOTO_VARIANTS.slice(roomIndex).concat(
    PHOTO_VARIANTS.slice(0, roomIndex)
  );

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          style={{
            position: "absolute", inset: 0,
            display: "flex",
            flexDirection: "column",
            overflow: isMobile ? "auto" : "hidden",
            padding: isMobile ? "12px 0 112px" : 0,
            alignItems: "center",
            justifyContent: isMobile ? "flex-start" : "center",
            background: `
              radial-gradient(circle at 18% 18%, rgba(255,255,255,0.65) 0%, transparent 26%),
              radial-gradient(circle at 82% 12%, rgba(255,245,220,0.45) 0%, transparent 28%),
              repeating-linear-gradient(
                90deg,
                rgba(115,85,55,0.020) 0px,
                rgba(115,85,55,0.020) 1px,
                transparent 1px,
                transparent 8px
              ),
              linear-gradient(135deg, #F4EDE3 0%, #E8DDCF 100%)
            `,
          }}
        >
        <RoomDecor isMobile={isMobile} />
          {/* Diagonales de perspectiva en viewBox 0-100 para que se calculen bien */}
          <svg
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              pointerEvents: "none",
              zIndex: 0,
              display: isMobile ? "none" : "block",
            }}
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <line x1="0"   y1="0"   x2={wallL} y2={wallT} stroke="rgba(80,55,35,0.07)" strokeWidth="0.25" />
            <line x1="100" y1="0"   x2={wallR} y2={wallT} stroke="rgba(80,55,35,0.07)" strokeWidth="0.25" />
            <line x1="0"   y1="100" x2={wallL} y2={wallB} stroke="rgba(80,55,35,0.07)" strokeWidth="0.25" />
            <line x1="100" y1="100" x2={wallR} y2={wallB} stroke="rgba(80,55,35,0.07)" strokeWidth="0.25" />
          </svg>

          {/* Pared roja */}
          <div
            style={{
              position: "relative", zIndex: 1,
              width: isMobile ? "min(94vw, 430px)" : `${W}%`,
              height: isMobile ? "auto" : `${H}%`,
              minHeight: isMobile ? "auto" : "auto",
              background: "linear-gradient(180deg, #D40000 0%, #B50000 60%, #9A0000 100%)",
              borderRadius: isMobile ? 8 : 3,
              boxShadow: "0 26px 70px rgba(0,0,0,0.5), inset 0 0 120px rgba(0,0,0,0.28)",
              display: "flex", flexDirection: "column",
              alignItems: "center", 
              padding: isMobile ? "16px 10px 54px" : "20px 26px",
              overflow: "hidden",
            }}
          >
            <h2
              className="font-heading"
              style={{
                fontSize: isMobile ? 20 : 24, color: "#D4AF37",
                textShadow: "0 2px 10px rgba(0,0,0,0.55)",
                letterSpacing: "0.18em", marginBottom: isMobile ? 18 : 14, flexShrink: 0,
              }}
            >
              Sala {roomIndex + 1}
            </h2>
            {/* Fotos en mural */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile
                    ? "repeat(2, minmax(0, 1fr))"
                    : "repeat(3, minmax(150px, 1fr))",
                  gridTemplateRows: isMobile
                    ? "none"
                    : "repeat(2, minmax(180px, 1fr))",
                  gap: isMobile ? "22px 8px" : "28px 34px",
                  justifyItems: "center",
                  alignItems: "center",
                  width: "100%",
                  maxWidth: isMobile ? 390 : 850,
                  flex: isMobile ? "initial" : 1,
                  padding: isMobile ? "4px 2px 28px" : "8px 18px 70px",
                  overflow: "visible",
                }}
              >
              {photos.map((photo, idx) => {
                const v = rotatedVariants[idx % rotatedVariants.length];
                const frameScale = isMobile ? 0.58 : 1;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 50, rotate: v.rotate * 0.4 }}
                    animate={{ opacity: 1, y: v.offsetY, rotate: v.rotate }}
                    transition={{ delay: idx * 0.13, duration: 0.6, type: "spring", damping: 16 }}
                    whileHover={{
                      scale: 1.05,
                      y: v.offsetY - 4,
                      rotate: v.rotate * 0.25,
                      zIndex: 10,
                      transition: { duration: 0.18 },
                    }}
                    onClick={() => onPhotoClick(photo)}
                    style={{
                      cursor: "pointer",
                      position: "relative",
                      zIndex: 1,
                      maxWidth: "100%",
                      transformOrigin: "center center",
                      gridColumn:
                        !isMobile && photos.length === 5 && idx === 3
                          ? "1 / 3"
                          : !isMobile && photos.length === 5 && idx === 4
                            ? "3 / 4"
                            : "auto",
                      justifySelf: "center",
                    }}
                  >
                    <WoodFrame
                      shape={v.shape}
                      width={v.w * frameScale}
                      height={v.h * frameScale}
                    >
                      <img
                        src={photo.url}
                        alt={`Foto ${idx + 1}`}
                        style={{
                          width: "100%", height: "100%",
                          objectFit: "cover",
                          borderRadius: v.shape === "oval" ? "50%" : 0,
                          display: "block",
                        }}
                      />
                    </WoodFrame>
                  </motion.div>
                );
              })}
            </div>

            {/* Zócalo */}
            <div
              style={{
                position: "absolute", bottom: 0, left: 0, right: 0, height: 85,
                background: "linear-gradient(to top, rgba(0,0,0,0.2) 0%, transparent 100%)",
                pointerEvents: "none",
              }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── CONTROLES ────────────────────────────────────────────────────────────────
function NavigationControls({ currentRoom, totalRooms, onPrevRoom, onNextRoom, onTimerClick }) {
  const canGoPrev = currentRoom > 0;
  const canGoNext = currentRoom < totalRooms - 1;
  const isMobile = window.innerWidth <= 768;
  const navBtn = (ok) => ({
    width: isMobile ? 48 : 56,
    height: isMobile ? 48 : 56,
    borderRadius: "50%",
    border: "1px solid rgba(0,0,0,0.1)",
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: ok ? "pointer" : "not-allowed", opacity: ok ? 1 : 0.38,
    background: ok ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.5)",
    backdropFilter: "blur(12px)",
    boxShadow: "0 4px 18px rgba(0,0,0,0.1)", transition: "all 0.25s",
  });

  return (
    <>
      {/* Botón de menú para abrir el contador de tiempo. Aparece en la esquina
          inferior izquierda y recuerda al corazón original. */}
      <motion.button
        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}
        whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.93 }}
        onClick={onTimerClick}
        style={{
          position: "fixed", zIndex: 50,
          width: isMobile ? 54 : 64,
          height: isMobile ? 54 : 64,
          bottom: isMobile ? 18 : 32,
          left: isMobile ? 18 : 32,
          borderRadius: "50%",
          border: "2px solid rgba(255,255,255,0.12)",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer",
          background: "linear-gradient(135deg, #E60000 0%, #B80000 100%)",
          boxShadow: "0 4px 22px rgba(200,0,0,0.45)",
        }}
      >
        {/* Icono de corazón para representar el menú desplegable del contador */}
        <Heart size={28} color="white" />
      </motion.button>

      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
        style={{
          position: "fixed", bottom: isMobile ? 22 : 32, left: "50%", transform: "translateX(-50%)", zIndex: 50,
          padding: "0.65rem 1.35rem", borderRadius: 50,
          background: "rgba(255,255,255,0.92)", backdropFilter: "blur(12px)",
          border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 4px 18px rgba(0,0,0,0.1)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {Array.from({ length: totalRooms }).map((_, idx) => (
            <div
              key={idx}
              style={{
                width: 8, height: 8, borderRadius: "50%", transition: "all 0.3s",
                background: idx === currentRoom ? "#D4AF37" : "rgba(0,0,0,0.18)",
                transform: idx === currentRoom ? "scale(1.35)" : "scale(1)",
              }}
            />
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}
        style={{ position: "fixed", bottom: isMobile ? 18 : 32, right: isMobile ? 18 : 32, zIndex: 50, display: "flex", gap: isMobile ? 10 : 12 }}
      >
        <motion.button whileHover={{ scale: canGoPrev ? 1.1 : 1 }} whileTap={{ scale: canGoPrev ? 0.93 : 1 }}
          onClick={onPrevRoom} disabled={!canGoPrev} style={navBtn(canGoPrev)}>
          <ChevronLeft size={24} color={canGoPrev ? "#333" : "#aaa"} />
        </motion.button>
        <motion.button whileHover={{ scale: canGoNext ? 1.1 : 1 }} whileTap={{ scale: canGoNext ? 0.93 : 1 }}
          onClick={onNextRoom} disabled={!canGoNext} style={navBtn(canGoNext)}>
          <ChevronRight size={24} color={canGoNext ? "#333" : "#aaa"} />
        </motion.button>
      </motion.div>
    </>
  );
}

// ─── TIMER MODAL ──────────────────────────────────────────────────────────────
function TimerModal({ isOpen, onClose }) {
  // Calcula una duración desglosada (años, meses, días, horas, minutos, segundos) entre
  // la fecha de inicio y la fecha actual. Utilizamos intervalToDuration para
  // obtener una diferencia exacta en cada unidad en lugar de mostrarlas como
  // acumulados independientes. Se actualiza cada segundo.
  const [duration, setDuration] = useState({ years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!isOpen) return;
    const update = () => {
      const now = new Date();
      const d = intervalToDuration({ start: START_DATE, end: now });
      setDuration(d);
    };
    update();
    const iv = setInterval(update, 1000);
    return () => clearInterval(iv);
  }, [isOpen]);

  // Construimos los bloques que se mostrarán. Nos centramos en años, meses y
  // días para reflejar un estilo similar a “3 años, 11 meses, 20 días…”.
  const blocks = [
    { value: duration.years,  label: "Años" },
    { value: duration.months, label: "Meses" },
    { value: duration.days,   label: "Días" },
    { value: duration.hours,  label: "Horas" },
    { value: duration.minutes, label: "Minutos" },
    { value: duration.seconds, label: "Segundos" },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Capa de fondo semitransparente para indicar que el menú está desplegado */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.5)",
              zIndex: 150,
            }}
          />

          {/* Caja flotante del contador. Se centra en pantalla y aparece con una
              animación emergente. */}
          <motion.div
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.88 }}
            transition={{ type: "spring", damping: 26, stiffness: 300 }}
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 151,
              width: "min(92vw, 34rem)",
              padding: "2.2rem 2rem 2rem",
              borderRadius: "14px",
              background: "rgba(255,255,255,0.92)",
              backdropFilter: "blur(14px)",
              border: "1px solid rgba(212,175,55,0.15)",
              boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
            }}
          >

            {/* Botón para cerrar el contador */}
            <button
              onClick={onClose}
              style={{
                position: "absolute",
                top: 12,
                right: 12,
                width: 32,
                height: 32,
                border: "none",
                background: "rgba(0,0,0,0.1)",
                color: "#555",
                borderRadius: "50%",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={18} />
            </button>

            <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
              <h2
                className="font-heading"
                style={{ fontSize: "clamp(1.3rem,3vw,1.8rem)", color: "#B80000", marginBottom: "0.45rem" }}
              >
                Nuestro Tiempo Juntos
              </h2>
              <p className="font-body" style={{ fontSize: "0.82rem", color: "#555", letterSpacing: "0.03em" }}>
                Desde el 26 de marzo de 2023
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: `repeat(${blocks.length},1fr)`, gap: "0.5rem" }}>
              {blocks.map(({ value, label }) => (
                <div
                  key={label}
                  style={{
                    textAlign: "center", padding: "0.8rem 0.2rem",
                    borderRadius: "8px",
                    background: "rgba(212,175,55,0.07)",
                    border: "1px solid rgba(212,175,55,0.12)",
                  }}
                >
                  <div className="font-heading" style={{ fontSize: "clamp(1.1rem,2.5vw,1.6rem)", color: "#D4AF37", lineHeight: 1 }}>
                    {value.toLocaleString()}
                  </div>
                  <div className="font-body" style={{ fontSize: "0.6rem", color: "#666", marginTop: "0.4rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── AUDIO ────────────────────────────────────────────────────────────────────
function BackgroundAudio({ isPlaying }) {
  const audioRef = useRef(null);
  useEffect(() => {
    audioRef.current = new Audio(AUDIO_URL);
    audioRef.current.loop = true;
    audioRef.current.volume = 0.18;
    return () => { audioRef.current?.pause(); audioRef.current = null; };
  }, []);
  useEffect(() => {
    if (!audioRef.current) return;
    isPlaying ? audioRef.current.play().catch(() => {}) : audioRef.current.pause();
  }, [isPlaying]);
  return null;
}

// ─── APP PRINCIPAL ────────────────────────────────────────────────────────────
export default function App() {
  const [showWelcome, setShowWelcome]       = useState(true);
  // Controla la visibilidad del contador de tiempo. Se puede abrir mediante
  // el menú desplegable (botón con corazón). Por defecto está oculto.
  const [showTimer, setShowTimer]           = useState(false);
  const [currentRoom, setCurrentRoom]       = useState(0);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [lightboxPhoto, setLightboxPhoto]   = useState(null);
  const totalRooms = galleryData.length;

  return (
    <>
      <style>{globalStyles}</style>
      <div style={{ width: "100vw", height: "100vh", overflow: "hidden", background: "#FAFAFA" }}>
        {/* Salas */}
        <div style={{ position: "fixed", inset: 0, zIndex: 1, background: "#FAFAFA" }}>
          {galleryData.map((photos, idx) => (
            <MuseumRoom
              key={idx}
              photos={photos}
              roomIndex={idx}
              isActive={currentRoom === idx}
              onPhotoClick={setLightboxPhoto}
            />
          ))}
        </div>

        <WelcomeOverlay
          isVisible={showWelcome}
          onEnter={() => {
            setShowWelcome(false);
            setIsAudioPlaying(true);
            // Al entrar ocultamos el temporizador; se abrirá con el botón de menú.
            setShowTimer(false);
          }}
        />

        {!showWelcome && (
          <NavigationControls
            currentRoom={currentRoom}
            totalRooms={totalRooms}
            onPrevRoom={() => currentRoom > 0 && setCurrentRoom((p) => p - 1)}
            onNextRoom={() => currentRoom < totalRooms - 1 && setCurrentRoom((p) => p + 1)}
            onTimerClick={() => setShowTimer(true)}
          />
        )}

        {/* Mostramos el temporizador cuando showTimer sea true. */}
        <TimerModal isOpen={showTimer} onClose={() => setShowTimer(false)} />
        <Lightbox photo={lightboxPhoto} onClose={() => setLightboxPhoto(null)} />
        <BackgroundAudio isPlaying={isAudioPlaying} />
      </div>
    </>
  );
}
