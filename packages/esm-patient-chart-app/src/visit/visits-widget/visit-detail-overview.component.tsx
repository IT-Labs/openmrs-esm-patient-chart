import React from 'react';
import { Button, InlineLoading, Tab, Tabs, TabList, TabPanel, TabPanels } from '@carbon/react';
import { EmptyState, ErrorState } from '@openmrs/esm-patient-common-lib';
import { formatDatetime, parseDate, useConfig, ExtensionSlot, useVisit } from '@openmrs/esm-framework';
import { useTranslation } from 'react-i18next';
import type { ChartConfig } from '../../config-schema';
import { mapEncounters, useInfiniteVisits } from './visit.resource';
import VisitsTable from './past-visits-components/visits-table';
import VisitSummary from './past-visits-components/visit-summary.component';
import styles from './visit-detail-overview.scss';
import CurrentVisitActions from './current-visit-actions/current-visit-actions.component';

interface VisitOverviewComponentProps {
  patientUuid: string;
}

function VisitDetailOverviewComponent({ patientUuid }: VisitOverviewComponentProps) {
  const { t } = useTranslation();
  const { visits, error, hasMore, isLoading, isValidating, mutateVisits, setSize, size } =
    useInfiniteVisits(patientUuid);
  const { showAllEncountersTab, showCurrentVisitTab } = useConfig<ChartConfig>();
  const shouldLoadMore = size !== visits?.length;
  const { currentVisit, isLoading: isLoadingCurrentVisit, error: isError } = useVisit(patientUuid);

  const visitsWithEncounters = visits
    ?.filter((visit) => visit?.encounters?.length)
    ?.flatMap((visitWithEncounters) => {
      return mapEncounters(visitWithEncounters);
    });

  return (
    <div className={styles.tabs}>
      <Tabs>
        <TabList aria-label="Visit detail tabs" contained>
          {showCurrentVisitTab && (
            <Tab className={styles.tab} id="visit-summaries-tab">
              {t('currentVisit', 'Current visit')}
            </Tab>
          )}
          <Tab className={styles.tab} id="visit-summaries-tab">
            {t('visitSummaries', 'Visit summaries')}
          </Tab>
          {showAllEncountersTab ? (
            <Tab className={styles.tab} id="all-encounters-tab">
              {t('allEncounters', 'All encounters')}
            </Tab>
          ) : (
            <></>
          )}
        </TabList>
        <TabPanels>
          <TabPanel>
            {isLoadingCurrentVisit ? (
              <InlineLoading description={`${t('loading', 'Loading')} ...`} role="progressbar" />
            ) : isError ? (
              <ErrorState headerTitle={t('activeVisit', 'Active visit')} error={isError} />
            ) : currentVisit ? (
              <div className={styles.container}>
                <div className={styles.header}>
                  <div className={styles.visitInfo}>
                    <div>
                      <h4 className={styles.visitType}>{currentVisit.visitType?.display}</h4>
                      <div className={styles.displayFlex}>
                        <h6 className={styles.dateLabel}>{t('start', 'Start')}:</h6>
                        <span className={styles.date}>{formatDatetime(parseDate(currentVisit.startDatetime))}</span>
                        {currentVisit.stopDatetime ? (
                          <>
                            <h6 className={styles.dateLabel}>{t('end', 'End')}:</h6>
                            <span className={styles.date}>{formatDatetime(parseDate(currentVisit.stopDatetime))}</span>
                          </>
                        ) : null}
                      </div>
                    </div>
                    {visits?.length && <CurrentVisitActions visit={currentVisit} />}
                  </div>
                </div>
                <VisitSummary visit={currentVisit} patientUuid={patientUuid} />
              </div>
            ) : (
              <EmptyState headerTitle={t('visit', 'visit')} displayText={t('Visit', 'Visit')} />
            )}
          </TabPanel>
          <TabPanel>
            {isLoading ? (
              <InlineLoading description={`${t('loading', 'Loading')} ...`} role="progressbar" />
            ) : error ? (
              <ErrorState headerTitle={t('visits', 'visits')} error={error} />
            ) : visits?.length ? (
              <>
                {visits.map((visit, i) => (
                  <div className={styles.container} key={i}>
                    <div className={styles.header}>
                      <div className={styles.visitInfo}>
                        <div>
                          <h4 className={styles.visitType}>{visit?.visitType?.display}</h4>
                          <div className={styles.displayFlex}>
                            <h6 className={styles.dateLabel}>{t('start', 'Start')}:</h6>
                            <span className={styles.date}>{formatDatetime(parseDate(visit?.startDatetime))}</span>
                            {visit?.stopDatetime ? (
                              <>
                                <h6 className={styles.dateLabel}>{t('end', 'End')}:</h6>
                                <span className={styles.date}>{formatDatetime(parseDate(visit?.stopDatetime))}</span>
                              </>
                            ) : null}
                          </div>
                        </div>
                        <div>
                          <ExtensionSlot
                            name="visit-detail-overview-actions"
                            className={styles.visitDetailOverviewActions}
                            state={{ patientUuid, visit }}
                          />
                        </div>
                      </div>
                    </div>
                    <VisitSummary visit={visit} patientUuid={patientUuid} />
                  </div>
                ))}
              </>
            ) : (
              <EmptyState headerTitle={t('visits', 'visits')} displayText={t('Visits', 'Visits')} />
            )}
          </TabPanel>
          {showAllEncountersTab && (
            <TabPanel>
              {isLoading ? (
                <InlineLoading description={`${t('loading', 'Loading')} ...`} role="progressbar" />
              ) : error ? (
                <ErrorState headerTitle={t('visits', 'visits')} error={error} />
              ) : visits?.length ? (
                <VisitsTable
                  mutateVisits={mutateVisits}
                  visits={visitsWithEncounters}
                  showAllEncounters
                  patientUuid={patientUuid}
                />
              ) : (
                <EmptyState headerTitle={t('visits', 'visits')} displayText={t('Visits', 'Visits')} />
              )}
            </TabPanel>
          )}
        </TabPanels>
      </Tabs>

      {hasMore ? (
        <Button
          className={styles.loadMoreButton}
          disabled={isValidating && shouldLoadMore}
          onClick={() => setSize(size + 1)}
        >
          {isValidating && shouldLoadMore ? (
            <InlineLoading description={`${t('loading', 'Loading')} ...`} role="progressbar" />
          ) : (
            t('loadMore', 'Load more')
          )}
        </Button>
      ) : null}
    </div>
  );
}

export default VisitDetailOverviewComponent;
