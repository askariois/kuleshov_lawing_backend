// hooks/useLocalStorage.ts
import { useEffect, useState } from 'react';

export function useLocalStorage<T>(
   key: string,
   initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
   const [storedValue, setStoredValue] = useState<T>(() => {
      try {
         const item = localStorage.getItem(key);
         return item ? JSON.parse(item) : initialValue;
      } catch (error) {
         console.error(`Error reading localStorage key "${key}":`, error);
         return initialValue;
      }
   });

   const setValue = (value: T | ((val: T) => T)) => {
      try {
         const valueToStore = value instanceof Function ? value(storedValue) : value;
         setStoredValue(valueToStore);
         localStorage.setItem(key, JSON.stringify(valueToStore));

         // Имитируем событие storage для текущей вкладки
         window.dispatchEvent(
            new StorageEvent('storage', {
               key,
               newValue: JSON.stringify(valueToStore),
               storageArea: localStorage,
            })
         );
      } catch (error) {
         console.error(`Error setting localStorage key "${key}":`, error);
      }
   };

   useEffect(() => {
      const handleStorageChange = (e: StorageEvent) => {
         if (e.key === key && e.storageArea === localStorage) {
            try {
               const newValue = e.newValue ? JSON.parse(e.newValue) : initialValue;
               setStoredValue(newValue);
            } catch (error) {
               console.error(`Error parsing storage event for key "${key}":`, error);
            }
         }
      };

      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
   }, [key, initialValue]);

   return [storedValue, setValue];
}