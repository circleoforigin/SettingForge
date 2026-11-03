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

  const unregisterGlobalReplacement =
  registerRequestHandler(
    'occurrences.replaceGlobal',
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

        if (!submission)
        {
          throw new Error(
            'occurrences.submit requires a submission.'
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

          if (
  message.sourceModuleId ===
    'overlay:celestial'
)
{
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
        globalCompletion.simulationTime
      );
  }
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
  };
}