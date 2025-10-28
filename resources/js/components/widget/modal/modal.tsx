import { motion, AnimatePresence } from 'framer-motion';

export interface IModal {
  show: boolean;
  title: string;
  onHide: () => void; // Функция без аргументов, возвращает void
  className?: string; // Опционально, как в предыдущих компонентах
  children: React.ReactNode; // Для React-компонентов или элементов
}


const Modal: React.FC<IModal> = ({ show, onHide, className, children, title }) => {
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
            className={`bg-white p-4 max-w-[600px] w-full mx-4 shadow-lg rounded-[12px]  text-[#212529] font-montserrat max-h-[80vh]  ${className}`}
            initial={{ opacity: 0, scale: 0.95, y: -50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 100 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className='flex justify-between items-center border-b-[1px] border-solid border-[#E5E5E5] pb-3 mb-4'>
              <h1 className='font-bold text-[#111111] text-[18px] w-full'>{title}</h1>
              <button
                className="flex   justify-center  items-center font-extrabold  rounded-[3px] z-10 w-[13px] h-[13px] text-[6px]  cursor-pointer bg-[#B1B1B1] text-white"
                onClick={onHide}
                aria-label="Закрыть"
              >
                ✕
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Modal;
