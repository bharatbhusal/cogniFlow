import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./Button";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  width?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  width,
}) => {
  if (!isOpen) return null;
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className={`bg-card rounded-xl shadow-2xl p-4 relative w-full max-w-lg ${
              width || ""
            }`}
            initial={{ scale: 0.95, y: 40, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 40, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            style={{
              boxShadow:
                "0 8px 32px 0 rgba(60, 120, 60, 0.18), 0 1.5px 6px 0 rgba(0,0,0,0.08)",
            }}
          >
            <Button
              className="absolute top-2 right-2  text-gray-100"
              onClick={onClose}
              aria-label="Close"
              style={{ fontSize: 24 }}
            >
              &times;
            </Button>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
