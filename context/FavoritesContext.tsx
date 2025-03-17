import React, { createContext, useContext, useState, ReactNode } from "react";
import { Surah } from "@/types";

interface FavoritesContextType {
  favorites: Surah[];
  addToFavorites: (surah: Surah) => void;
  removeFromFavorites: (surahNumber: number) => void;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

interface FavoritesProviderProps {
  children: ReactNode;
}

export const FavoritesProvider: React.FC<FavoritesProviderProps> = ({ children }) => {
  const [favorites, setFavorites] = useState<Surah[]>([]);

  const addToFavorites = (surah: Surah) => {
    if (!favorites.some((item) => item.number === surah.number)) {
      setFavorites([...favorites, surah]);
    }
  };

  const removeFromFavorites = (surahNumber: number) => {
    setFavorites(favorites.filter((item) => item.number !== surahNumber));
  };

  return (
    <FavoritesContext.Provider
      value={{ favorites, addToFavorites, removeFromFavorites }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error("useFavorites must be used within a FavoritesProvider");
  }
  return context;
};