import { useState, useEffect } from 'react';
import apiClient from '@/lib/api';

export interface VoipEntity {
  id: string;
  name: string;
  extension_number?: string;
  description?: string;
}

export interface UseVoipEntitiesOptions {
  store_id?: string;
  search?: string;
}

export function useVoipEntities(entityType: 'extensions' | 'ring-groups' | 'queues' | 'conference-rooms' | 'voicemail-boxes' | 'ivr-menus' | 'time-conditions' | 'sip-trunks', options?: UseVoipEntitiesOptions) {
  const [entities, setEntities] = useState<VoipEntity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEntities = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      let response;
      switch (entityType) {
        case 'extensions':
          response = await apiClient.getExtensions(options);
          break;
        case 'ring-groups':
          response = await apiClient.getRingGroups(options);
          break;
        case 'queues':
          response = await apiClient.getQueues(options);
          break;
        case 'conference-rooms':
          response = await apiClient.getConferenceRooms(options);
          break;
        case 'voicemail-boxes':
          response = await apiClient.getVoicemailBoxes(options);
          break;
        case 'ivr-menus':
          response = await apiClient.getIvrMenus(options);
          break;
        case 'time-conditions':
          response = await apiClient.getTimeConditions(options);
          break;
        case 'sip-trunks':
          response = await apiClient.getSipTrunks(options);
          break;
        default:
          throw new Error(`Unknown entity type: ${entityType}`);
      }
      
      setEntities((response.data as VoipEntity[]) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch entities');
      setEntities([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEntities();
  }, [entityType, options?.store_id, options?.search]);

  return {
    entities,
    isLoading,
    error,
    refetch: fetchEntities
  };
}

// Hook specifico per le opzioni dei select
export function useVoipEntityOptions(entityType: 'extensions' | 'ring-groups' | 'queues' | 'conference-rooms' | 'voicemail-boxes' | 'ivr-menus' | 'time-conditions', store_id?: string) {
  const { entities, isLoading, error } = useVoipEntities(entityType, { store_id });
  
  const options = entities.map(entity => ({
    value: entity.id,
    label: entity.extension_number ? `${entity.name} (${entity.extension_number})` : entity.name,
    description: entity.description
  }));

  return {
    options,
    isLoading,
    error
  };
}
