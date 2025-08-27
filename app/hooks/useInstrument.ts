import { useState, useEffect } from 'react';
import { fetchInstruments } from '../lib/exchange-clients';
import type { Venue, AnyInstrument } from '../types/domain';

export const useInstruments = (venue: Venue) => {
    const [instruments, setInstruments] = useState<AnyInstrument[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true; 
        
        const loadInstruments = async () => {
            setIsLoading(true);
            const fetchedInstruments = await fetchInstruments(venue);
            if (isMounted) {
                setInstruments(fetchedInstruments);
                setIsLoading(false);
            }
        };

        loadInstruments();

        return () => {
            isMounted = false;
        };
    }, [venue]);

    return { instruments, isLoading };
};