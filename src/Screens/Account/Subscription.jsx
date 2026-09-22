import {
  ActivityIndicator,
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
import {paymentService} from '../../Services/PaymentService';
import {subscriptionService} from '../../Services/SubscriptionService';
import {mapSubscriptionPlans} from '../../Models/SubscriptionPlanModel';

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

  useEffect(() => {
    fetchActivePlans();
  }, [fetchActivePlans]);

  // Highlight the plan matching the current subscription once plans are loaded
  useEffect(() => {
    if (!plans.length) return;
    const matchedIndex = plans.findIndex(plan => plan.id === subscription?.plan);
    setActiveIndex(matchedIndex >= 0 ? matchedIndex : 0);
  }, [plans, subscription?.plan]);

  const buttonWidth =
    (ScreenWidth - padding(16) * 2 - gap(10) * 2) / Math.max(plans.length, 1);

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

    const planExpired = subscription?.endDate < Date.now();
    const topPlan = plans[plans.length - 1];

    if (subscription?.plan === plan.id && !planExpired) {
      ToastAndroid.show(
        'You are already subscribed to this plan',
        ToastAndroid.LONG,
      );
      return;
    }

    if (topPlan && subscription?.plan === topPlan.id && !planExpired) {
      ToastAndroid.show(
        `You are already subscribed to ${topPlan.name}`,
        ToastAndroid.LONG,
      );
      return;
    }

    try {
      setIsLoading(true);
      const order = await paymentService.createOrder(plan.price);
      if (order?.status) {
        const options = {
          description: `Payment for Billtrack ${plan.name}`,
          amount: order?.order?.amount,
          currency: 'INR',
          image: 'https://billtrack.co.in/public/assets/images/logo.png',
          key: 'rzp_live_RpQhHpWDUvOOad', 
          // key: 'rzp_test_RpQkpzsXTA2VO6',
          order_id: order?.order?.id,
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
        RazorpayCheckout.open(options)
          .then(async data => {
            const plan = plans[activeIndex];
            const subscriptionPurchase =
              await subscriptionService.purchaseSubscription({
                token: token,
                plan: plan.id,
                orderId: data?.razorpay_order_id,
                paymentId: data?.razorpay_payment_id,
                paymentSignature: data?.razorpay_signature,
                amount: plan.price,
              });
            if (subscriptionPurchase?.status) {
              const currentSubscriptionAfterSubscribe =
                subscriptionPurchase?.data;
              await resetSubscription({
                plan: currentSubscriptionAfterSubscribe?.plan,
                startDate: currentSubscriptionAfterSubscribe?.startDate,
                endDate: currentSubscriptionAfterSubscribe?.endDate,
              });
              ToastAndroid.show(`Payment Success`, ToastAndroid.LONG);
              return;
            }
            ToastAndroid.show(subscriptionPurchase?.message, ToastAndroid.LONG);
          })
          .catch(error => {
            ToastAndroid.show('Payment Cancelled', ToastAndroid.LONG);
          });
      }
    } catch (error) {
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
        contentContainerStyle={styles.container}>
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
                <View style={{padding: padding(16), justifyContent: 'center'}}>
                  <Text style={styles.featuresTitleText}>
                    {plan.name} Features
                  </Text>
                  {plan?.id === subscription?.plan && (
                    <Text style={styles.saveText}>Active Plan</Text>
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
                  plan.id === subscription?.plan && {backgroundColor: colors.sucess+20,borderColor: colors.sucess},
                ]}
                onPress={() => handleScrollTo(index)}>
                <Text style={styles.payBtnTitleText} numberOfLines={2}>
                  {plan.name}
                </Text>

                <View style={styles.textCOntainer}>
                  <Text style={styles.moneyText}>₹{plan.price}</Text>
                  <Text style={styles.moneyText}>{plan.unit}</Text>
                </View>

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
            style={styles.subscribeBtn}
            onPress={handleSubscribe}
            disabled={isLoading}>
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
  featuresTitleText: {
    fontSize: font(16),
    fontFamily: fonts.inMedium,
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
    height: icon(90),
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
