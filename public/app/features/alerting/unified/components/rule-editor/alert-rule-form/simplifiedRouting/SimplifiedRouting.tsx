import { css } from '@emotion/css';
import { createAction, createReducer } from '@reduxjs/toolkit';
import React, { useEffect, useReducer } from 'react';
import { useFormContext } from 'react-hook-form';
import { useToggle } from 'react-use';

import { GrafanaTheme2 } from '@grafana/data';
import { CollapsableSection, Icon, Link, Stack, Text, useStyles2 } from '@grafana/ui';
import { AlertmanagerProvider } from 'app/features/alerting/unified/state/AlertmanagerContext';
import { RuleFormValues } from 'app/features/alerting/unified/types/rule-form';
import {
  AlertManagerDataSource,
  getAlertManagerDataSourcesByPermission,
} from 'app/features/alerting/unified/utils/datasource';
import { createUrl } from 'app/features/alerting/unified/utils/url';

import { ContactPointSelector } from './ContactPointSelector';
import { MuteTimingFields } from './MuteTimingFields';
import { RoutingSettings } from './RouteSettings';

export interface AMContactPoint {
  alertManager: AlertManagerDataSource;
  selectedContactPoint?: string;
  muteTimeIntervals: string[];
  overrideGrouping: boolean;
  groupBy?: string[];
  overrideTimings: boolean;
  groupWaitValue?: string;
  groupIntervalValue?: string;
  repeatIntervalValue?: string;
}

export const selectContactPoint = createAction<{ receiver: string | undefined; alertManager: AlertManagerDataSource }>(
  'simplifiedRouting/selectContactPoint'
);
export const updateMuteTimings = createAction<{ muteTimings: string[]; alertManager: string }>(
  'simplifiedRouting/updateMuteTimings'
);

export const updateOverrideGrouping = createAction<{ overrideGrouping: boolean; alertManager: string }>(
  'simplifiedRouting/overrideGrouping'
);

export const receiversReducer = createReducer<AMContactPoint[]>([], (builder) => {
  builder.addCase(selectContactPoint, (state, action) => {
    const { receiver, alertManager } = action.payload;
    const newContactPoint: AMContactPoint = {
      selectedContactPoint: receiver,
      alertManager,
      overrideGrouping: false,
      muteTimeIntervals: [],
      overrideTimings: false,
    };
    const existingContactPoint = state.find((cp) => cp.alertManager.name === alertManager.name);

    if (existingContactPoint) {
      existingContactPoint.selectedContactPoint = receiver;
    } else {
      state.push(newContactPoint);
    }
  });
  builder.addCase(updateMuteTimings, (state, action) => {
    const { muteTimings, alertManager } = action.payload;
    const existingContactPoint = state.find((cp) => cp.alertManager.name === alertManager);
    if (existingContactPoint) {
      existingContactPoint.muteTimeIntervals = muteTimings;
    }
  });
  // builder.addCase(updateOverrideGrouping, (state, action) => {
  //   const { overrideGrouping, alertManager } = action.payload;
  //   const existingContactPoint = state.find((cp) => cp.alertManager.name === alertManager);
  //   if (existingContactPoint) {
  //     existingContactPoint.overrideGrouping = overrideGrouping;
  //   }
  // });
});

export function SimplifiedRouting() {
  const { getValues, setValue } = useFormContext<RuleFormValues>();
  const styles = useStyles2(getStyles);
  const contactPointsInAlert = getValues('contactPoints');
  const muteIntervals = getValues('muteTimeIntervals');
  const overrideGrouping = getValues('overrideGrouping');

  const allAlertManagersByPermission = getAlertManagerDataSourcesByPermission('notification');

  // We decided to only show internal alert manager for now. Once we want to show external alert managers we can use this code
  // const alertManagersDataSources = allAlertManagersByPermission.availableInternalDataSources.concat(
  //   allAlertManagersByPermission.availableExternalDataSources
  // );

  const alertManagersDataSources = allAlertManagersByPermission.availableInternalDataSources;

  const alertManagersDataSourcesWithConfigAPI = alertManagersDataSources.filter((am) => am.hasConfigurationAPI);

  // we merge the selected contact points with the alert manager meta data
  const alertManagersWithSelectedContactPoints = alertManagersDataSourcesWithConfigAPI.map((am) => {
    const selectedContactPoint = contactPointsInAlert?.find((cp) => cp.alertManager === am.name);
    return {
      alertManager: am,
      selectedContactPoint: selectedContactPoint?.selectedContactPoint,
      muteTimeIntervals: muteIntervals,
      overrideGrouping: overrideGrouping,
      overrideTimings: false,
    };
  });

  // use reducer to keep this alertManagersWithSelectedContactPoints in the state
  const [alertManagersWithCPState, dispatch] = useReducer(receiversReducer, alertManagersWithSelectedContactPoints);

  function getContactPointsForForm(alertManagersWithCP: AMContactPoint[]) {
    return alertManagersWithCP.map((am) => {
      return { alertManager: am.alertManager.name, selectedContactPoint: am.selectedContactPoint };
    });
  }

  // whenever we update the receiversState we have to update the form too
  useEffect(() => {
    const contactPointsForForm = getContactPointsForForm(alertManagersWithCPState);
    setValue('contactPoints', contactPointsForForm, { shouldValidate: false });
  }, [alertManagersWithCPState, setValue]);

  const shouldShowAM = true;

  function onChangeMuteTimings(value: string[]) {
    dispatch(updateMuteTimings({ muteTimings: value, alertManager: '' }));
  }

  const [isOpenRoutingSettings, toggleOpenRoutingSettings] = useToggle(false);

  return alertManagersWithCPState.map((alertManagerContactPoint, index) => {
    const alertManagerName = alertManagerContactPoint.alertManager.name;
    return (
      <div key={index}>
        <Stack direction="column">
          {shouldShowAM && (
            <Stack direction="row" alignItems="center">
              <div className={styles.firstAlertManagerLine}></div>
              <div className={styles.alertManagerName}>
                {' '}
                Alert manager:
                <img
                  src={alertManagerContactPoint.alertManager.imgUrl}
                  alt="Alert manager logo"
                  className={styles.img}
                />
                {alertManagerName}
              </div>
              <div className={styles.secondAlertManagerLine}></div>
            </Stack>
          )}
          <Stack direction="row" gap={1} alignItems="center">
            <AlertmanagerProvider accessType={'notification'} alertmanagerSourceName={alertManagerName}>
              <ContactPointSelector
                selectedReceiver={alertManagerContactPoint.selectedContactPoint}
                dispatch={dispatch}
                alertManager={alertManagerContactPoint.alertManager}
              />
            </AlertmanagerProvider>
            <LinkToContactPoints />
          </Stack>
          <CollapsableSection
            label="Muting, grouping and timings"
            isOpen={isOpenRoutingSettings}
            className={styles.collapsableSection}
            onToggle={toggleOpenRoutingSettings}
          >
            <Stack direction="column" gap={1}>
              <MuteTimingFields alertManager={alertManagerName} onChange={onChangeMuteTimings} />
              <RoutingSettings dispatch={dispatch} alertManagerName={alertManagerName} />
            </Stack>
          </CollapsableSection>
        </Stack>
      </div>
    );
  });
}

function LinkToContactPoints() {
  const hrefToContactPoints = '/alerting/notifications';
  return (
    <Link target="_blank" href={createUrl(hrefToContactPoints)} rel="noopener" aria-label="View alert rule">
      <Stack direction="row" gap={1} alignItems="center" justifyContent="center">
        <Text color="secondary">To browse contact points and create new ones go to</Text>
        <Text color="link">Contact points</Text>
        <Icon name={'external-link-alt'} size="sm" color="link" />
      </Stack>
    </Link>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  firstAlertManagerLine: css({
    height: 1,
    width: theme.spacing(4),
    backgroundColor: theme.colors.secondary.main,
  }),
  alertManagerName: css({
    with: 'fit-content',
  }),
  secondAlertManagerLine: css({
    height: '1px',
    width: '100%',
    flex: 1,
    backgroundColor: theme.colors.secondary.main,
  }),
  img: css({
    marginLeft: theme.spacing(2),
    width: theme.spacing(3),
    height: theme.spacing(3),
    marginRight: theme.spacing(1),
  }),
  collapsableSection: css({
    width: 'fit-content',
    fontSize: theme.typography.bodySmall.fontSize,
  }),
});
