import type {
  OccurrenceSubmission,
  HostRequestMessage,
} from '@settingforge/module-sdk';
import { occurrenceCoordinator } from './OccurrenceCoordinator';
import { occurrenceProducerRegistry } from './OccurrenceProducerRegistry';
import { occurrenceProcessor } from './OccurrenceProcessor';
import { occurrenceService } from './OccurrenceService';
import { stationaryTimeProspectService } from '../../simulation/StationaryTimeProspectService';

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

  
const unregisterGlobalProducerRegistration =
  registerRequestHandler(
    'occurrences.registerGlobalProducer',
    async (message) =>
    {
      occurrenceProducerRegistry.registerGlobal(
        message.sourceModuleId
      );

      return {
        registered: true,
      };
    }
  );

  const unregisterGlobalReplacement =
  registerRequestHandler(
    'occurrences.replaceGlobal',
    async (message) =>
    {
      const submission =
        message.payload as
          | OccurrenceSubmission
          | undefined;

      if (
        !submission ||
        submission.pieceId !== null ||
        !Array.isArray(submission.occurrences)
      )
      {
        throw new Error(
          'occurrences.replaceGlobal requires a global Occurrence submission.'
        );
      }

      for (const occurrence of submission.occurrences)
      {
        if (
          occurrence.pieceId !== null ||
          occurrence.sourceModuleId !==
            message.sourceModuleId
        )
        {
          throw new Error(
            'Global replacement contains an Occurrence belonging to another producer or piece.'
          );
        }
      }

      if (
  !occurrenceProducerRegistry.hasGlobal(
    message.sourceModuleId
  )
)
{
  throw new Error(
    `Module "${message.sourceModuleId}" is not registered as a Global Occurrence producer.`
  );
}

      occurrenceService.replaceGlobalByProducer(
        message.sourceModuleId,
        submission.occurrences.filter(
          (occurrence) =>
            occurrence.reaction !== 'none'
        )
      );

      return {
        replaced: true,
      };
    }
  );

  const unregisterSubmission =
    registerRequestHandler(
      'occurrences.submit',
      async (message) =>
      {
const submission =
  message.payload as
    | (OccurrenceSubmission & {
        requestId?: string;
      })
    | undefined;

        if (!submission)
        {
          throw new Error(
            'occurrences.submit requires a submission.'
          );
        }


const registered =
  submission.pieceId === null
    ? occurrenceProducerRegistry.hasGlobal(
        message.sourceModuleId
      )
    : occurrenceProducerRegistry.has(
        message.sourceModuleId
      );

if (!registered)
{
  throw new Error(
    `Module "${message.sourceModuleId}" is not registered for this Occurrence category.`
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

        if (submission.pieceId === null)
        {
          if (
            typeof submission.requestId !== 'string' ||
            !occurrenceCoordinator.isActiveGlobalRequest(
              submission.requestId,
              message.sourceModuleId
            )
          )
          {
            return;

          }
          occurrenceService.addGlobal(
            occurrences.filter(
              (occurrence) =>
                occurrence.reaction !==
                  'none'
            )
          );

          const completed =
            occurrences.some(
              (occurrence) =>
                occurrence.reaction ===
                  'none'
            );

          
const globalCompletion =
  occurrences.find(
    (occurrence) =>
      occurrence.reaction === 'none' &&
      occurrence.simulationTime ===
        occurrenceCoordinator
          .getGlobalPendingThrough()
  );

if (globalCompletion)
{
occurrenceCoordinator
  .completeGlobalCoverage(
    message.sourceModuleId,
    submission.requestId,
    globalCompletion.simulationTime
  );
}

          if (
            completed &&
            message.sourceModuleId ===
              'regions' &&
            stationaryTimeProspectService
              .isInitializing()
          )
          {
            stationaryTimeProspectService
              .finishInitialization(
                stationaryTimeProspectService
                  .getProspects()
                  .length
              );

            occurrenceProcessor
              .completeStationaryTimeIfReady();
          }
        }
        else
        {
          occurrenceCoordinator.addOccurrences(
            submission.pieceId,
            occurrences.filter(
              (occurrence) =>
                occurrence.reaction !==
                  'none'
            )
          );

          const completion =
            occurrences.find(
              (occurrence) =>
                occurrence.reaction ===
                  'none' ||
                occurrence.reaction ===
                  'recalculate'
            );

          if (completion)
          {
            const round =
              occurrenceCoordinator
                .completeProducer(
                  submission.pieceId,
                  message.sourceModuleId
                );

            if (
              round.state ===
              'complete'
            )
            {
              void occurrenceProcessor
                .resolveRound(
                  submission.pieceId
                )
                .catch(
                  (
                    error: unknown
                  ) =>
                  {
                    console.error(
                      '[Occurrences] Unable to resolve completed round.',
                      error
                    );
                  }
                );
            }
          }
        }
      }
    );

  return () =>
  {
    unregisterGlobalReplacement();
    unregisterSubmission();
    unregisterProducerRegistration();
    unregisterGlobalProducerRegistration();
  };
}