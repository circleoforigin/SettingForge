import type {
  OccurrenceSubmission,
  HostRequestMessage,
} from '@settingforge/module-sdk';
import { occurrenceCoordinator } from './OccurrenceCoordinator';
import { occurrenceProducerRegistry } from './OccurrenceProducerRegistry';
import { occurrenceService } from './OccurrenceService';

type RegisterRequestHandler =
  (
    type: string,
    handler: (
      message: HostRequestMessage
    ) => Promise<unknown>
  ) => () => void;

export function registerOccurrenceHostService(
  registerRequestHandler: RegisterRequestHandler
): () => void
{
  const unregisterProducerRegistration =
    registerRequestHandler(
      'occurrences.registerProducer',
      async (message) =>
      {
        occurrenceProducerRegistry.register(
          message.sourceModuleId
        );

        return {
          registered: true,
        };
      }
    );

  const unregisterSubmission =
    registerRequestHandler(
      'occurrences.submit',
      async (message) =>
      {
        if (
          !occurrenceProducerRegistry.has(
            message.sourceModuleId
          )
        )
        {
          throw new Error(
            `Module "${message.sourceModuleId}" is not registered as an Occurrence producer.`
          );
        }

        const submission =
          message.payload as
            | OccurrenceSubmission
            | undefined;

               if (!submission?.pieceId)
        {
          throw new Error(
            'occurrences.submit requires pieceId.'
          );
        }

        const occurrences =
          submission.occurrences ?? [];

        for (const occurrence of occurrences)
        {
          if (
            occurrence.pieceId !==
            submission.pieceId
          )
          {
            throw new Error(
              'Submitted Occurrence pieceId does not match the submission pieceId.'
            );
          }

          if (
            occurrence.sourceModuleId !==
            message.sourceModuleId
          )
          {
            throw new Error(
              'Submitted Occurrence sourceModuleId does not match the submitting module.'
            );
          }
        }

        const completion = occurrences.find(
          (occurrence) =>
            occurrence.reaction === 'none'
        );

        if (completion)
        {
          occurrenceCoordinator.completeProducer(
            submission.pieceId,
            message.sourceModuleId
          );
        }

        occurrenceService.addMany(
          occurrences.filter(
            (occurrence) =>
              occurrence.reaction !== 'none'
          )
        );

        return {
          accepted:
            occurrences.length,
        };
      }
    );

  return () =>
  {
    unregisterSubmission();
    unregisterProducerRegistration();
  };
}