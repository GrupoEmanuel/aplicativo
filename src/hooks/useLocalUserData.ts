import { useLocalUserContext } from '../store/LocalUserContext';

export const useLocalUserData = () => {
    return useLocalUserContext();
};
