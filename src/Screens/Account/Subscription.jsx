import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View,
} from 'react-native';

import React, {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
} from 'react';
import {useFocusEffect} from '@react-navigation/native';
import {Layout} from '../Layout';
import {DottedDivider, Loader, SecondaryHeader} from '../../Components';
import {
  font,
  gap,
  icon,
  margin,
  padding,
  ScreenWidth,
} from '../../utils/responsive';
import {colors} from '../../utils/colors';
import {fonts} from '../../utils/fonts';
import Lucide from '@react-native-vector-icons/lucide';
import Octicons from '@react-native-vector-icons/octicons';
import {RazorpayKey} from '../../utils/config';
import RazorpayCheckout from 'react-native-razorpay';
import {
  useAuth,
  useAuthToken,
  useBusiness,
  useSubscription,
  useUser,
} from '../../Contexts/AuthContext';
import {subscriptionService} from '../../Services/SubscriptionService';
import {mapSubscriptionPlans} from '../../Models/SubscriptionPlanModel';
import {mapCurrentSubscription} from '../../Models/CurrentSubscriptionModel';
import {mapSubscriptionActivation} from '../../Models/SubscriptionActivationModel';
import {mapSubscriptionOrder} from '../../Models/SubscriptionOrderModel';

const Subscription = memo(() => {
  const subscription = useSubscription();
  const {resetSubscription} = useAuth();
  const token = useAuthToken();

  const scrollRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const [plans, setPlans] = useState([]);
  const [isPlansLoading, setIsPlansLoading] = useState(true);
  const [plansError, setPlansError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Kept in local state (not just the AuthContext value) so it is re-fetched
  // fresh every time this screen is opened, instead of relying on the cached
  // subscription the context may still be holding.
  const [currentSubscriptionData, setCurrentSubscriptionData] = useState(subscription);
  const currentPlan = mapCurrentSubscription(currentSubscriptionData);

  const fetchActivePlans = useCallback(async () => {
    try {
      setIsPlansLoading(true);
      setPlansError(null);
      const response = await subscriptionService.getActivePlans(token);
      if (response?.success) {
        setPlans(mapSubscriptionPlans(response?.data));
      } else {
        setPlansError(response?.message || 'Failed to load subscription plans');
      }
    } catch (error) {
      setPlansError(error?.message || 'Failed to load subscription plans');
    } finally {
      setIsPlansLoading(false);
    }
  }, [token]);

  const fetchCurrentSubscription = useCallback(async () => {
    if (!token) return;
    const response = await subscriptionService.currentSubscription(token);
    if (response?.status) {
      setCurrentSubscriptionData(response?.data);
      // Keep the shared AuthContext subscription (used elsewhere, e.g. the
      // Account page plan badge) in sync with this fresh fetch too.
      resetSubscription(response?.data);
    }
  }, [token, resetSubscription]);

  // Always re-check the active plan every time the Subscription screen is opened
  useFocusEffect(
    useCallback(() => {
      fetchActivePlans();
      fetchCurrentSubscription();
    }, [fetchActivePlans, fetchCurrentSubscription]),
  );

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([fetchActivePlans(), fetchCurrentSubscription()]);
    setIsRefreshing(false);
  }, [fetchActivePlans, fetchCurrentSubscription]);

  // Highlight the plan matching the current subscription once plans are loaded
  useEffect(() => {
    if (!plans.length) return;
    const matchedIndex = plans.findIndex(plan => plan.id === currentPlan.planId);
    setActiveIndex(matchedIndex >= 0 ? matchedIndex : 0);
  }, [plans, currentPlan.planId]);

  const getRemainingTime = endDate => {
    if (!endDate) return 'Active Plan';
    const end = new Date(endDate.replace(' ', 'T'));
    const now = new Date();
    const diffMs = end - now;

    if (diffMs <= 0) return 'Expired';

    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays > 0) {
      return `${diffDays} days left`;
    }

    const diffMins = Math.floor(diffMs / (1000 * 60));
    return `${diffMins} mnts left`;
  };

  const buttonWidth =
    (ScreenWidth - padding(16) * 2 - gap(10) * 2) / Math.max(plans.length, 1);

  const isSelectedPlanActive =
    !!plans[activeIndex] && plans[activeIndex].id === currentPlan.planId;

  // Scroll when clicking bottom buttons
  const handleScrollTo = useCallback(pageIndex => {
    if (!scrollRef.current) return;
    setActiveIndex(pageIndex);
    scrollRef.current.scrollTo({
      x: pageIndex * ScreenWidth,
      y: 0,
      animated: true,
    });
  }, []);

  // Update active index when scrolling horizontally
  const handleMomentumScrollEnd = useCallback(
    e => {
      const offsetX = e.nativeEvent.contentOffset.x;
      const newIndex = Math.round(offsetX / ScreenWidth);
      if (newIndex !== activeIndex) setActiveIndex(newIndex);
    },
    [activeIndex],
  );

  const businessPhone = useBusiness('phone');
  const businessEmail = useBusiness('email');

  const userPhone = useUser('phone');
  const userEmail = useUser('email');

  const handleSubscribe = async () => {
    const plan = plans[activeIndex];
    if (!plan) return;

    if (plan.price === 0) {
      ToastAndroid.show('The free plan cannot be purchased', ToastAndroid.LONG);
      return;
    }

    const planExpired = currentPlan.endDate
      ? new Date(currentPlan.endDate).getTime() < Date.now()
      : false;
    const topPlan = plans[plans.length - 1];

    if (currentPlan.planId === plan.id && !planExpired) {
      ToastAndroid.show(
        'You are already subscribed to this plan',
        ToastAndroid.LONG,
      );
      return;
    }

    if (topPlan && currentPlan.planId === topPlan.id && !planExpired) {
      ToastAndroid.show(
        `You are already subscribed to ${topPlan.name}`,
        ToastAndroid.LONG,
      );
      return;
    }

    try {
      setIsLoading(true);
      console.log('[Subscription] Creating order for plan:', plan.id, plan.name);
      const orderResponse = await subscriptionService.createSubscriptionOrder({
        token,
        planId: plan.id,
        currentVersionId: plan.currentVersionId,
      });
      console.log('[Subscription] Order create response:', orderResponse);

      if (!orderResponse?.status) {
        console.error('[Subscription] Order creation failed:', orderResponse);
        ToastAndroid.show(
          orderResponse?.message || 'Failed to create order',
          ToastAndroid.LONG,
        );
        return;
      }

      const order = mapSubscriptionOrder(orderResponse?.data);
      const options = {
        description: `Payment for Billtrack ${plan.name}`,
        amount: order.amount,
        currency: order.currency,
        image: 'https://billtrack.co.in/public/assets/images/logo.png',
        key: RazorpayKey,
        order_id: order.orderId,
        name: 'BillTrack',
        theme: colors.primary,
        prefill: {},
      };
      if (businessEmail) {
        options.prefill.email = businessEmail;
      } else {
        options.prefill.email = userEmail;
      }

      if (businessPhone) {
        options.prefill.contact = businessPhone;
      } else {
        options.prefill.contact = userPhone;
      }

      console.log('[Subscription] Opening Razorpay checkout with options:', options);
      RazorpayCheckout.open(options)
        .then(async data => {
          console.log('[Subscription] Razorpay checkout success:', data);
          const activationPayload = {
            token,
            planId: plan.id,
            razorpayOrderId: data?.razorpay_order_id,
            razorpayPaymentId: data?.razorpay_payment_id,
            razorpaySignature: data?.razorpay_signature,
          };
          console.log('[Subscription] Calling activateSubscription with:', activationPayload);
          const activationResponse =
            await subscriptionService.activateSubscription(activationPayload);
          console.log('[Subscription] activateSubscription response:', activationResponse);

          if (activationResponse?.status) {
            const activatedSubscription = mapSubscriptionActivation(
              activationResponse?.data,
            );
            console.log('[Subscription] Activated subscription:', activatedSubscription);
            // Refresh the current-subscription so the active-plan
            // highlight/border/disabled button reflect the change immediately
            await fetchCurrentSubscription();
            ToastAndroid.show(
              activationResponse?.message || 'Subscription activation success',
              ToastAndroid.LONG,
            );
            return;
          }
          console.error(
            '[Subscription] activateSubscription failed:',
            activationResponse,
          );
          ToastAndroid.show(activationResponse?.message, ToastAndroid.LONG);
        })
        .catch(error => {
          console.error('[Subscription] Razorpay checkout error/cancelled:', {
            code: error?.code,
            description: error?.description,
            reason: error?.reason,
            source: error?.source,
            step: error?.step,
            metadata: error?.metadata,
            raw: error,
          });
          ToastAndroid.show(
            error?.description || 'Payment Cancelled',
            ToastAndroid.LONG,
          );
        });
    } catch (error) {
      console.error('[Subscription] handleSubscribe error:', error);
      ToastAndroid.show('Something went wrong. Please try again.', ToastAndroid.LONG);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!scrollRef.current) return;

    scrollRef.current.scrollTo({
      x: activeIndex * ScreenWidth,
      animated: false,
    });
  }, [activeIndex]);

  if (isPlansLoading && plans.length === 0) {
    return (
      <Layout>
        <SecondaryHeader title="Subscription" isSearch={false} />
        <View style={styles.centerContainer}>
          <Loader />
        </View>
      </Layout>
    );
  }

  if (plansError && plans.length === 0) {
    return (
      <Layout>
        <SecondaryHeader title="Subscription" isSearch={false} />
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{plansError}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchActivePlans}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </Layout>
    );
  }

  return (
    <Layout>
      <SecondaryHeader title="Subscription" isSearch={false} />

      <ScrollView
        style={{flex: 1}}
        nestedScrollEnabled
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          pagingEnabled
          ref={scrollRef}
          bounces
          snapToInterval={ScreenWidth}
          snapToAlignment="center"
          decelerationRate="fast"
          onMomentumScrollEnd={handleMomentumScrollEnd}
          style={styles.horizontainerContainer}
          scrollEventThrottle={16}>
          {plans.map(plan => (
            <View key={plan.id} style={styles.cardContainer}>
              <View style={styles.btnContainer}>
                <Text style={styles.btnText}>
                  {plan.name}
                  {plan?.nameSlogan ? `${plan.nameSlogan}` : ''}
                </Text>
              </View>

              <View style={styles.subscriptonContainer}>
                <View style={styles.featuresHeaderRow}>
                  <Text style={styles.featuresTitleText} numberOfLines={1}>
                    {plan.name} Features
                  </Text>
                  {plan?.id === currentPlan.planId && (
                    <Text style={styles.activePlanBadge} numberOfLines={1}>
                      {plan.price === 0
                        ? getRemainingTime(currentPlan.endDate)
                        : 'Active Plan'}
                    </Text>
                  )}
                </View>

                <DottedDivider marginVertical={0} />

                {plan.features.map((item, i) => (
                  <View key={i} style={styles.featuresContainer}>
                    <Text style={styles.featuresText}>{item.label}</Text>
                    <View style={styles.featuresTextContainer}>
                      {item.value ? (
                        <Octicons
                          name="check"
                          size={icon(20)}
                          color={colors.sucess}
                        />
                      ) : (
                        <Octicons
                          name="x"
                          size={icon(20)}
                          color={colors.error}
                        />
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </ScrollView>
        <View style={styles.bottomContainer}>
          <View style={styles.buttonContainer}>
            {plans.map((plan, index) => (
              <TouchableOpacity
                key={plan.id}
                style={[
                  styles.payBtn,
                  {width: buttonWidth},
                  activeIndex === index && {borderColor: '#000'},
                  plan.id === currentPlan.planId && styles.activePayBtn,
                ]}
                onPress={() => handleScrollTo(index)}>
                <Text style={styles.payBtnTitleText} numberOfLines={2}>
                  {plan.name}
                </Text>

                <View style={styles.textCOntainer}>
                  <Text style={styles.moneyText}>₹{plan.price}</Text>
                  <Text style={styles.moneyText}>{plan.unit}</Text>
                </View>

                {plan.id === currentPlan.planId && (
                  <Text style={styles.activePlanText}>
                    {plan.price === 0
                      ? getRemainingTime(currentPlan.endDate)
                      : 'Active Plan'}
                  </Text>
                )}

                {plan.compareAt && (
                  <Text
                    style={[
                      styles.monthText,
                      {fontSize: font(14), marginTop: -5},
                    ]}>
                    {plan.compareAt}
                  </Text>
                )}

                {plan.save && (
                  <Text style={styles.saveText}>Save {plan.save}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[
              styles.subscribeBtn,
              isSelectedPlanActive && styles.subscribeBtnDisabled,
            ]}
            onPress={handleSubscribe}
            disabled={isLoading || isSelectedPlanActive}>
            {isLoading ? (
              <ActivityIndicator color={'#fff'} />
            ) : (
              <>
                <Text style={styles.subscribeBtnText}>Subscribe & Pay</Text>
                <Lucide name="wallet" color={'#fff'} size={icon(20)} />
              </>
            )}
          </TouchableOpacity>

          <View style={styles.noteContainer}>
            <Text style={[styles.noteText, {color: 'red'}]}>*</Text>
            <Text style={styles.noteText}>
              By proceeding, you consent to recurring billing for your selected
              plan. Subscriptions renew automatically until cancelled. And so
              payments are processed securely and are non-refundable.
            </Text>
          </View>
        </View>
      </ScrollView>
    </Layout>
  );
});

// =============================
//     STYLES (UNCHANGED)
// =============================
const styles = StyleSheet.create({
  container: {
    paddingVertical: padding(16),
  },
  cardContainer: {
    width: ScreenWidth,
    paddingHorizontal: padding(16),
    gap: gap(16),
  },
  btnContainer: {
    width: '100%',
    height: icon(46),
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: icon(8),
  },
  btnText: {
    color: '#fff',
    fontSize: font(16),
    fontFamily: fonts.inBold,
  },
  horizontainerContainer: {},
  subscriptonContainer: {
    backgroundColor: '#fff',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingBottom: padding(10),
  },
  featuresContainer: {
    paddingVertical: padding(10),
    paddingHorizontal: padding(16),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  featuresHeaderRow: {
    padding: padding(16),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: gap(8),
  },
  featuresTitleText: {
    flexShrink: 1,
    fontSize: font(16),
    fontFamily: fonts.inMedium,
  },
  activePlanBadge: {
    flexShrink: 0,
    fontSize: font(10),
    paddingVertical: padding(3),
    paddingHorizontal: padding(8),
    borderRadius: 3,
    borderWidth: 0.25,
    borderBottomColor: colors.sucess,
    backgroundColor: colors.sucess + 20,
    fontFamily: fonts.inBold,
    textAlign: 'center',
    color: colors.sucess,
  },
  featuresText: {
    fontSize: font(14),
    fontFamily: fonts.inRegular,
  },
  bottomContainer: {
    backgroundColor: '#fff',
    width: '100%',
    paddingHorizontal: padding(16),
    paddingTop: padding(10),
    paddingBottom: padding(20),
    marginVertical: margin(30),
  },
  buttonContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  payBtn: {
    minHeight: icon(90),
    backgroundColor: '#F7F7F7',
    paddingHorizontal: padding(8),
    paddingVertical: padding(8),
    borderWidth: 1,
    borderRadius: icon(8),
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    gap: gap(4),
  },
  activePayBtn: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: colors.primary + '15',
  },
  payBtnTitleText: {
    fontSize: font(10),
    fontFamily: fonts.inRegular,
    textAlign: 'center',
  },
  textCOntainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: gap(4),
  },
  moneyText: {
    fontSize: font(13),
    fontFamily: fonts.inMedium,
    textAlign: 'center',
  },
  activePlanText: {
    fontSize: font(9),
    fontFamily: fonts.inSemiBold,
    color: colors.primary,
  },
  saveText: {
    position: 'absolute',
    top: padding(10),
    right: padding(10),
    backgroundColor: colors.sucess + 20,
    paddingVertical: padding(3),
    paddingHorizontal: padding(10),
    borderRadius: 3,
    borderWidth: 0.25,
    borderBottomColor: colors.sucess,
    fontFamily: fonts.inBold,
    textAlign: 'center',
    color: colors.sucess,
  },
  subscribeBtn: {
    width: '100%',
    paddingVertical: padding(16),
    marginVertical: margin(16),
    backgroundColor: '#000',
    flexDirection: 'row',
    gap: gap(11),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
  },
  subscribeBtnDisabled: {
    backgroundColor: colors.border,
  },
  subscribeBtnText: {
    fontSize: font(16),
    fontFamily: fonts.inSemiBold,
    color: '#fff',
  },
  noteContainer: {
    flexDirection: 'row',
  },
  noteText: {
    fontSize: 12,
    lineHeight: 20,
    fontFamily: fonts.inRegular,
  },
  featuresTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: gap(5),
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: padding(16),
    gap: gap(16),
  },
  errorText: {
    fontSize: font(14),
    fontFamily: fonts.inMedium,
    color: colors.error,
    textAlign: 'center',
  },
  retryBtn: {
    paddingVertical: padding(10),
    paddingHorizontal: padding(24),
    backgroundColor: colors.primary,
    borderRadius: 5,
  },
  retryBtnText: {
    fontSize: font(14),
    fontFamily: fonts.inSemiBold,
    color: '#fff',
  },
});

export default Subscription;
