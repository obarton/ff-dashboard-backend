export const InsertAttendeesSQL = `INSERT INTO attendees 
(
    attendee_num, 
    order_num, 
    first_name, 
    last_name, 
    email, 
    billing_address_1, 
    billing_address_2, 
    billing_state, 
    billing_zip,
    billing_country,
    attendee_notes,
    quantity,
    price_tier,
    ticket_type,
    barcode_num,
    date_attending,
    device_name,
    check_in_date,
    attendee_status,
    ip_location_city,
    ip_location_state,
    ip_location_country,
    ip_location
) VALUES ?`

export const InsertEventsSQL = `INSERT INTO events 
(
    event_id, 
    event_name, 
    venue_name,
    event_date 
) VALUES ?`

export const InsertOrdersSQL = `INSERT INTO orders 
(
    order_num, 
    event_id, 
    order_date,
    total_paid,
    fees_paid,
    ticketing_platform_fees,
    ticketing_platform_payment_processing_fees,
    order_type,
    order_notes,
    attendee_status
) VALUES ?`

export const InsertSquareDoorSalesSQL = `INSERT INTO square_door_sales 
(
    date,
    time,
    timezone,
    category,
    item,
    quantity,
    price_point_name,
    sku,
    modifiers_applied,
    gross_sales,
    discounts,
    net_sales,
    tax,
    transaction_id,
    payment_id,
    device_name,
    notes,
    details,
    event_type,
    location,
    dining_option,
    customer_id,
    customer_name,
    customer_reference_id,
    unit,
    count,
    itemization_type,
    fufillment_note
) VALUES ?`

export const InsertSocialReachFacebookSQL = `INSERT INTO social_reach_facebook 
(
    date,
    reach,
    platform
) VALUES ?`

export const InsertSocialProfileVisitsFacebookSQL = `INSERT INTO social_profile_visits_facebook 
(
    date,
    profile_visits,
    platform
) VALUES ?`

export const InsertSocialFollowersFacebookSQL = `INSERT INTO social_followers_facebook 
(
    date,
    new_followers,
    platform
) VALUES ?`

export const InsertTikTokFollowersSQL = `INSERT INTO social_followers_tiktok 
(
    date,
    new_followers,
    total_followers
) VALUES ?`

export const GetOrdersSQL = `SELECT order_type, SUM(total_paid) as order_total, COUNT(order_num) as order_qty FROM orders
JOIN events on orders.event_id = events.event_id
GROUP BY order_type`

export const GetAttendeesSQL = `SELECT attendee_status, Count(*) FROM attendees 
GROUP BY attendee_status`

export const GetSalesSQL = `SELECT online_ticket_quantity, online_ticket_revenue, door_ticket_revenue FROM
(
  SELECT SUM(q) as online_ticket_quantity, SUM(t) as online_ticket_revenue
  FROM
    (SELECT a.*, o.quantity_purchased as q, o.total_spent as t
      FROM 
      (
          SELECT *, COUNT(order_num) as quantity_purchased, SUM(total_paid) as total_spent FROM orders
          GROUP BY order_num
      ) as o
      JOIN 
      (
        SELECT *, SUM(quantity) FROM attendees
        GROUP BY order_num
      ) as a 
      ON o.order_num = a.order_num
    GROUP BY o.order_num) as grouped_orders
    ) as online_sales_data, 
    (SELECT SUM(gross_sales) as door_ticket_revenue FROM square_door_sales) as door_sales_data
`

export const GetRepeatCheckInsQuery = `
SELECT * FROM (
      SELECT Count(*) as repeat_check_in_count FROM (
          SELECT email, MIN(date_attending) as first_date_attending, MAX(date_attending) as latest_date_attending, MAX(check_in_date) as most_recent_check_in, COUNT(*) as num_dates_attended FROM
              (
                  SELECT email, date_attending, check_in_date, COUNT(*) as event_attendee_count FROM attendees
                  WHERE attendee_status = 'Checked In'
                  GROUP BY email, date_attending
                  ORDER BY email
              ) as attendee_dates_checked_in_counts
              GROUP BY email
              ORDER BY num_dates_attended DESC
      ) as dates_checked_in_counts_by_email
      WHERE num_dates_attended > 1
  ) as repeat_check_in_count,
  (
  -- Get one-time check ins count
      SELECT Count(*) as single_check_in_count FROM (
          SELECT email, MIN(date_attending) as first_date_attending, MAX(date_attending) as latest_date_attending, MAX(check_in_date) as most_recent_check_in, COUNT(*) as num_dates_attended FROM
              (
                  SELECT email, date_attending, check_in_date, COUNT(*) as event_attendee_count FROM attendees
                  WHERE attendee_status = 'Checked In'
                  GROUP BY email, date_attending
                  ORDER BY email
              ) as attendee_dates_checked_in_counts
              GROUP BY email
              ORDER BY num_dates_attended DESC
      ) as dates_checked_in_counts_by_email
      WHERE num_dates_attended = 1
  ) as single_check_in_count`

  export const GetFacebookSocialReachQuery = `
  SELECT DATE_FORMAT(date, '%Y-%m-01') AS month, SUM(reach) as total_reach, platform FROM social_reach_facebook
    GROUP BY month, platform;
  `

  export const GetCurrentMonthFacebookSocialReachQuery = `
  SELECT DATE_FORMAT(date, '%Y-%m-01') AS month, SUM(reach) as total_reach, platform from social_reach_facebook 
  WHERE MONTH(date) = MONTH(now()) and YEAR(date) = YEAR(now())
  GROUP BY platform;
  `

  export const GetPreviousMonthFacebookSocialReachQuery = `
  SELECT DATE_FORMAT(date, '%Y-%m-01') AS month, SUM(reach) as total_reach, platform from social_reach_facebook 
    WHERE date BETWEEN DATE_FORMAT(NOW() - INTERVAL 1 MONTH, '%Y-%m-01 00:00:00')
    AND DATE_FORMAT(LAST_DAY(NOW() - INTERVAL 1 MONTH), '%Y-%m-%d 23:59:59')
    GROUP BY platform;
  `

  export const GetFacebookSocialProfileVisitsQuery = `
  SELECT DATE_FORMAT(date, '%Y-%m-01') AS month, SUM(profile_visits) as total_profile_visits, platform FROM social_profile_visits_facebook
    GROUP BY month, platform;
  `

  export const GetFacebookFollowersQuery = `SELECT DATE_FORMAT(date, '%Y-%m-01') AS month, SUM(new_followers) as total_new_followers, platform FROM social_followers_facebook
  GROUP BY month, platform;`

  export const GetTikTokFollowersQuery = `SELECT DATE_FORMAT(date, '%Y-%m-01') AS month, SUM(new_followers) as total_new_followers, total_followers FROM social_followers_tiktok
  GROUP BY month`