import PropTypes from "prop-types";
import { motion, AnimatePresence } from "motion/react";
import { IModal } from "./../../../types/components/modal";

const Modal: React.FC<IModal> = ({ show, onHide, className, children }) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 "
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={onHide}
        >
          <motion.div
            className={`bg-white p-6 pt-0 max-w-[600px] w-full mx-4 shadow-lg rounded-[12px]  text-[#212529] font-montserrat max-h-[80vh]  ${className}`}
            initial={{ opacity: 0, scale: 0.95, y: -50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 100 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="flex w-full h-[24px] py-6 justify-end text-[#212529] hover:text-secondary sticky top-0 z-10 bg-white"
              onClick={onHide}
              aria-label="Закрыть"
            >
              ✕
            </button>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Modal;
